import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Database, ArrowRight, CheckCircle, Settings, Sparkles } from 'lucide-react';
import companyService from '../services/companyService';
import toast from 'react-hot-toast';

interface InitializationProgress {
  stage: string;
  message: string;
  progress: number;
  total: number;
  table: string | null;
}

const CompanyInitialization: React.FC = () => {
  const navigate = useNavigate();
  const [showSelection, setShowSelection] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState<InitializationProgress>({
    stage: 'starting',
    message: 'Preparing to initialize your company...',
    progress: 0,
    total: 0,
    table: null,
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleYes = () => {
    setShowSelection(false);
    startInitialization();
  };

  const handleChoose = () => {
    navigate('/select-initialization-data');
  };

  const handleNo = () => {
    navigate('/manual-configuration-steps');
  };

  const startInitialization = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      setResult(null);
      setProgress({
        stage: 'starting',
        message: 'Starting initialization...',
        progress: 0,
        total: 0,
        table: null,
      });

      // Call the initialization endpoint
      const result = await companyService.initializeCompany();

      setResult(result);
      setIsInitializing(false);

      if (result.success) {
        setProgress({
          stage: 'completed',
          message: `Initialization completed! ${result.successful} records created successfully.`,
          progress: result.total,
          total: result.total,
          table: null,
        });

        // Show success message with details
        const successMsg = result.failed > 0 
          ? `Initialization completed! ${result.successful} records created, ${result.failed} skipped.`
          : `Company initialized successfully! ${result.successful} records created.`;
        toast.success(successMsg);
        
        // Redirect to app main after a delay (longer if there were failures to show details)
        setTimeout(() => {
          navigate('/app-main');
        }, result.failed > 0 ? 5000 : 2000);
      } else {
        setError(result.message || 'Initialization failed');
        toast.error(result.message || 'Initialization failed');
      }
    } catch (err: any) {
      setIsInitializing(false);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize company';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.min(100, Math.round((progress.progress / progress.total) * 100));
  };

  const formatTableName = (tableName: string | null) => {
    if (!tableName) return '';
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Show selection options first
  if (showSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Initialize Company Data
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setting Up Your Company
          </h1>
          <p className="text-gray-600">
            We're initializing your company with default data. This will only take a moment.
          </p>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialization Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={startInitialization}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : result && result.success ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialization Complete!</h2>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                <div className="text-sm text-gray-600">Created</div>
              </div>
              {result.failed > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{result.failed}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              )}
            </div>

            {/* Detailed Results */}
            {result.details && Object.keys(result.details).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 mb-3">Initialization Details:</h3>
                <div className="space-y-2">
                  {Object.entries(result.details).map(([table, detail]: [string, any]) => (
                    <div key={table} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{formatTableName(table)}</span>
                      <div className="flex items-center space-x-3">
                        {detail.created > 0 && (
                          <span className="text-green-600 font-medium">
                            {detail.created} created
                          </span>
                        )}
                        {detail.errors && detail.errors.length > 0 && (
                          <span className="text-yellow-600 font-medium">
                            {detail.errors.length} skipped
                          </span>
                        )}
                        {detail.created === 0 && (!detail.errors || detail.errors.length === 0) && (
                          <span className="text-gray-400">No records</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors (if any) */}
            {result.errors && result.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Some records were skipped:</h3>
                <div className="text-sm text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 5).map((error: any, idx: number) => (
                    <div key={idx}>• {error.message || JSON.stringify(error)}</div>
                  ))}
                  {result.errors.length > 5 && (
                    <div className="text-yellow-600 italic">
                      ... and {result.errors.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center text-blue-600 pt-4">
              <span className="mr-2">Redirecting to app main</span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {progress.message}
                </span>
                <span className="text-sm text-gray-500">
                  {progress.progress} / {progress.total || '?'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Current Table */}
            {progress.table && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Initializing {formatTableName(progress.table)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {progress.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isInitializing && !progress.table && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {/* Info Message */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> This process creates default accounts, stores, financial years, 
                customer groups, and other essential data for your company. Please do not close this page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInitialization;

