import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Plus, SkipForward, Loader2, Database, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

// Import forms
import FinancialYearForm from '../components/FinancialYearForm';
import CurrencyForm from '../components/CurrencyForm';
import PriceCategoryForm from '../components/PriceCategoryForm';
import { ExchangeRateForm } from '../components/ExchangeRateForm';
import StoreLocationForm from '../components/StoreLocationForm';
import CustomerGroupForm from '../components/CustomerGroupForm';
import ProductCategoryForm from '../components/ProductCategoryForm';
import PackagingForm from '../components/PackagingForm';
import TaxCodeForm from '../components/TaxCodeForm';
import AdjustmentReasonForm from '../components/AdjustmentReasonForm';
import ReturnReasonForm from '../components/ReturnReasonForm';
import { PaymentMethodForm } from '../components/PaymentMethodForm';
import PaymentTypeForm from '../components/PaymentTypeForm';

// Import services
import { financialYearService } from '../services/financialYearService';
import { currencyService } from '../services/currencyService';
import { priceCategoryService } from '../services/priceCategoryService';        
import { createExchangeRate } from '../services/exchangeRateService';
import { storeService } from '../services/storeService';
import { customerGroupService } from '../services/customerGroupService';        
import { createProductCategory } from '../services/productCategoryService';
import { packagingService } from '../services/packagingService';
import { taxCodeService } from '../services/taxCodeService';
import { adjustmentReasonService } from '../services/adjustmentReasonService';
import { returnReasonService } from '../services/returnReasonService';
import { paymentMethodService } from '../services/paymentMethodService';
import { paymentTypeService } from '../services/paymentTypeService';

interface TableInfo {
  key: string;
  name: string;
  description: string;
  count: number;
  required?: boolean;
}

// Remaining tables after account_types and accounts (already auto-initialized)
const REMAINING_TABLES: TableInfo[] = [
  // Core foundation data
  { key: 'financial_years', name: 'Financial Year', description: 'Current year financial period', count: 1 },
  { key: 'currencies', name: 'Currencies', description: 'Currency configurations', count: 2 },
  { key: 'price_categories', name: 'Price Categories', description: 'Pricing tiers', count: 4 },
  { key: 'exchange_rates', name: 'Exchange Rates', description: 'Currency exchange rates', count: 2 },
  
  // Secondary data
  { key: 'stores', name: 'Stores', description: 'Default store locations', count: 2 },
  { key: 'customer_groups', name: 'Customer Groups', description: 'Default customer categories', count: 3 },
  { key: 'product_categories', name: 'Product Categories', description: 'Product classification', count: 7 },
  { key: 'packaging', name: 'Packaging', description: 'Packaging units', count: 2 },
  { key: 'tax_codes', name: 'Tax Codes', description: 'Tax rate configurations', count: 5 },
  { key: 'adjustment_reasons', name: 'Adjustment Reasons', description: 'Stock adjustment reasons', count: 2 },
  { key: 'return_reasons', name: 'Return Reasons', description: 'Product return reasons', count: 3 },
  { key: 'payment_methods', name: 'Payment Methods', description: 'Payment method types', count: 2 },
  { key: 'payment_types', name: 'Payment Types', description: 'Payment type configurations', count: 2 },
];

const ManualStepByStepInitialization: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [initializedTables, setInitializedTables] = useState<Set<string>>(new Set());
  const [skippedTables, setSkippedTables] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTable = REMAINING_TABLES[currentStep];
  const totalSteps = REMAINING_TABLES.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Handle form submission based on table type
  const handleFormSubmit = async (data: any) => {
    if (!currentTable) return;

    try {
      setIsSubmitting(true);

      switch (currentTable.key) {
        case 'financial_years':
          await financialYearService.createFinancialYear(data);
          break;
        case 'currencies':
          await currencyService.createCurrency(data);
          break;
        case 'price_categories':
          await priceCategoryService.createPriceCategory(data);
          break;
        case 'exchange_rates':
          await createExchangeRate(data);
          break;
        case 'stores':
          await storeService.createStore(data);
          break;
        case 'customer_groups':
          await customerGroupService.createCustomerGroup(data);
          break;
        case 'product_categories':
          await createProductCategory(data);
          break;
        case 'packaging':
          await packagingService.createPackaging(data);
          break;
        case 'tax_codes':
          await taxCodeService.createTaxCode(data);
          break;
        case 'adjustment_reasons':
          await adjustmentReasonService.createAdjustmentReason(data);
          break;
        case 'return_reasons':
          await returnReasonService.createReturnReason(data);
          break;
        case 'payment_methods':
          await paymentMethodService.createPaymentMethod(data);
          break;
        case 'payment_types':
          await paymentTypeService.createPaymentType(data);
          break;
        default:
          throw new Error(`Unknown table type: ${currentTable.key}`);
      }

      toast.success(`${currentTable.name} created successfully!`);
      setShowForm(false);
      
      // Mark as initialized and move to next step
      setInitializedTables(prev => new Set(prev).add(currentTable.key));
      
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || `Failed to create ${currentTable.name}`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleSkip = () => {
    if (!currentTable) return;

    setSkippedTables(prev => new Set(prev).add(currentTable.key));
    setShowForm(false);
    
    // Move to next step
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const initializedCount = initializedTables.size;
    const skippedCount = skippedTables.size;
    
    if (initializedCount > 0) {
      toast.success(`Setup complete! ${initializedCount} data types added, ${skippedCount} skipped.`);
    } else {
      toast('You can add data later from settings.', { icon: 'ℹ️' });
    }
    
    setTimeout(() => {
      navigate('/app-main');
    }, 2000);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowForm(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setShowForm(false);
    }
  };

  // Render form based on current table
  const renderForm = () => {
    if (!currentTable || !showForm) return null;

    switch (currentTable.key) {
      case 'financial_years':
        return (
          <FinancialYearForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        );
      case 'currencies':
        return (
          <CurrencyForm
            isOpen={true}
            onClose={handleFormCancel}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        );
      case 'price_categories':
        return (
          <PriceCategoryForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        );
      case 'exchange_rates':
        return (
          <ExchangeRateForm
            isOpen={true}
            onClose={handleFormCancel}
            onSubmit={handleFormSubmit}
            currencies={[]}
            isLoading={isSubmitting}
          />
        );
      case 'stores':
        return (
          <StoreLocationForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            stores={[]}
            packagingTypes={[]}
            isLoading={isSubmitting}
          />
        );
      case 'customer_groups':
        return (
          <CustomerGroupForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            accounts={[]}
            liabilityAccounts={[]}
            isLoading={isSubmitting}
          />
        );
      case 'product_categories':
        return (
          <ProductCategoryForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            taxCodes={[]}
            accounts={[]}
            isLoading={isSubmitting}
          />
        );
      case 'packaging':
        return (
          <PackagingForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        );
      case 'tax_codes':
        return (
          <TaxCodeForm
            isOpen={true}
            onClose={handleFormCancel}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            accounts={[]}
          />
        );
      case 'adjustment_reasons':
        return (
          <AdjustmentReasonForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        );
      case 'return_reasons':
        return (
          <ReturnReasonForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isSubmitting}
          />
        );
      case 'payment_methods':
        return (
          <PaymentMethodForm
            isOpen={true}
            onClose={handleFormCancel}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case 'payment_types':
        return (
          <PaymentTypeForm
            isOpen={true}
            onClose={handleFormCancel}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            paymentMethods={[]}
            accounts={[]}
          />
        );
      default:
        return null;
    }
  };

  if (!currentTable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isInitialized = initializedTables.has(currentTable.key);
  const isSkipped = skippedTables.has(currentTable.key);

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Database className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Your Company Data
          </h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Account Types and Accounts have already been initialized automatically. 
            You can now add the remaining data types step by step, or skip any you don't need right now.
          </p>
        </div>

        {/* Current Step Card */}
        {!showForm && (
          <div className={`mb-6 p-6 rounded-lg border-2 transition-all duration-200 ${
            isInitialized
              ? 'border-green-500 bg-green-50'
              : isSkipped
              ? 'border-gray-300 bg-gray-50'
              : 'border-indigo-200 bg-white'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{currentTable.name}</h2>
                  {isInitialized && (
                    <Check className="w-6 h-6 text-green-600" />
                  )}
                  {isSkipped && (
                    <X className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">{currentTable.description}</p>
                <p className="text-sm text-gray-500">
                  {currentTable.count} {currentTable.count === 1 ? 'record' : 'records'} available
                </p>
              </div>
            </div>

            {isInitialized && (
              <div className="mt-4 p-3 bg-green-100 rounded text-green-800 text-sm">
                ✓ {currentTable.name} has been added successfully
              </div>
            )}

            {isSkipped && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-gray-600 text-sm">
                ⊘ {currentTable.name} was skipped. You can add it later if needed.
              </div>
            )}
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-6 p-6 rounded-lg border-2 border-indigo-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Add {currentTable.name}</span>
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {renderForm()}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex space-x-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Skip Button */}
          {!isInitialized && !showForm && (
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <SkipForward className="w-5 h-5" />
              <span>Skip</span>
            </button>
          )}

          {/* Add/Show Form Button */}
          {!isInitialized && !isSkipped && !showForm && (
            <button
              onClick={handleAdd}
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add {currentTable.name}</span>
            </button>
          )}

          {/* Next Button (when initialized or skipped) */}
          {(isInitialized || isSkipped) && currentStep < totalSteps - 1 && !showForm && (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {/* Complete Button (on last step) */}
          {currentStep === totalSteps - 1 && (isInitialized || isSkipped) && !showForm && (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Added: <strong className="text-green-600">{initializedTables.size}</strong></span>
            <span>Skipped: <strong className="text-gray-500">{skippedTables.size}</strong></span>
            <span>Remaining: <strong className="text-indigo-600">{totalSteps - currentStep - 1}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualStepByStepInitialization;
