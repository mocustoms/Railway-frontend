import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  Save, 
  TestTube, 
  AlertCircle, 
  CheckCircle, 
  Loader,
  ArrowLeft,
  Eye,
  EyeOff,
  Server,
  Key,
  HardDrive,
  User,
  Network
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseConfigService, DatabaseConfig } from '../services/databaseConfigService';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ContentContainer from '../components/ContentContainer';
import toast from 'react-hot-toast';
import './DatabaseSettings.css';

const DatabaseSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is system admin
  const isSystemAdmin = user?.isSystemAdmin || false;

  const [config, setConfig] = useState<DatabaseConfig>({
    DB_HOST: '',
    DB_PORT: 5432,
    DB_NAME: '',
    DB_USER: '',
    DB_PASSWORD: '',
    DB_DIALECT: 'postgres',
    DB_LOGGING: false
  });

  const [originalConfig, setOriginalConfig] = useState<DatabaseConfig | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current configuration
  useEffect(() => {
    if (!isAuthenticated || !isSystemAdmin) {
      toast.error('Access denied. Only system administrators can access this page.');
      navigate('/');
      return;
    }

    loadConfig();
  }, [isAuthenticated, isSystemAdmin, navigate]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await databaseConfigService.getConfig();
      
      if (response.success && response.config) {
        // If password is masked, we need to fetch it differently
        // For now, we'll show empty password field
        const configData = {
          ...response.config,
          DB_PASSWORD: response.config.DB_PASSWORD === '***masked***' ? '' : response.config.DB_PASSWORD
        };
        
        setConfig(configData);
        setOriginalConfig(configData);
      }
    } catch (error: any) {
      toast.error('Failed to load database configuration');
      // Error loading config
    } finally {
      setIsLoading(false);
    }
  };

  // Check for changes
  useEffect(() => {
    if (originalConfig) {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);
    }
  }, [config, originalConfig]);

  const handleInputChange = (field: keyof DatabaseConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: field === 'DB_PORT' ? parseInt(value) || 5432 : 
               field === 'DB_LOGGING' ? value === true || value === 'true' : value
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      const response = await databaseConfigService.testConnection(config);
      
      if (response.success) {
        setTestResult({ success: true, message: response.message });
        toast.success('Connection test successful!');
      } else {
        setTestResult({ 
          success: false, 
          message: response.message || response.error || 'Connection test failed' 
        });
        toast.error(response.message || 'Connection test failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Connection test failed';
      setTestResult({ success: false, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!config.DB_HOST || !config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Test connection before saving
    try {
      setIsTesting(true);
      const testResponse = await databaseConfigService.testConnection(config);
      
      if (!testResponse.success) {
        toast.error('Cannot save. Connection test failed. Please fix the configuration.');
        setTestResult({ 
          success: false, 
          message: testResponse.message || 'Connection test failed' 
        });
        setIsTesting(false);
        return;
      }
    } catch (error: any) {
      toast.error('Cannot save. Connection test failed.');
      setIsTesting(false);
      return;
    }

    try {
      setIsSaving(true);
      const response = await databaseConfigService.updateConfig(config);
      
      if (response.success) {
        toast.success(response.message || 'Database configuration updated successfully');
        if (response.warning) {
          toast(response.warning, { icon: '⚠️', duration: 5000 });
        }
        setOriginalConfig({ ...config });
        setHasChanges(false);
      } else {
        toast.error(response.message || 'Failed to update configuration');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setIsSaving(false);
      setIsTesting(false);
    }
  };

  if (!isAuthenticated || !isSystemAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className="database-settings">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-7 h-7 text-blue-600" />
                Database Configuration
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure database connection settings for the application
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Database Host */}
            <div>
              <label htmlFor="db_host" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Database Host *
              </label>
              <Input
                id="db_host"
                type="text"
                value={config.DB_HOST}
                onChange={(e) => handleInputChange('DB_HOST', e.target.value)}
                placeholder="localhost"
                className="w-full"
              />
            </div>

            {/* Database Port */}
            <div>
              <label htmlFor="db_port" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Network className="w-4 h-4" />
                Database Port *
              </label>
              <Input
                id="db_port"
                type="number"
                value={config.DB_PORT}
                onChange={(e) => handleInputChange('DB_PORT', e.target.value)}
                placeholder="5432"
                className="w-full"
                min="1"
                max="65535"
              />
            </div>

            {/* Database Name */}
            <div>
              <label htmlFor="db_name" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Database Name *
              </label>
              <Input
                id="db_name"
                type="text"
                value={config.DB_NAME}
                onChange={(e) => handleInputChange('DB_NAME', e.target.value)}
                placeholder="easymauzo_pos"
                className="w-full"
              />
            </div>

            {/* Database User */}
            <div>
              <label htmlFor="db_user" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Database User *
              </label>
              <Input
                id="db_user"
                type="text"
                value={config.DB_USER}
                onChange={(e) => handleInputChange('DB_USER', e.target.value)}
                placeholder="postgres"
                className="w-full"
              />
            </div>

            {/* Database Password */}
            <div>
              <label htmlFor="db_password" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Database Password *
              </label>
              <div className="relative">
                <Input
                  id="db_password"
                  type={showPassword ? 'text' : 'password'}
                  value={config.DB_PASSWORD}
                  onChange={(e) => handleInputChange('DB_PASSWORD', e.target.value)}
                  placeholder="Enter database password"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Database Dialect */}
            <div>
              <label htmlFor="db_dialect" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Dialect
              </label>
              <Input
                id="db_dialect"
                type="text"
                value={config.DB_DIALECT}
                onChange={(e) => handleInputChange('DB_DIALECT', e.target.value)}
                placeholder="postgres"
                className="w-full"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Currently only PostgreSQL is supported</p>
            </div>

            {/* Database Logging */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="db_logging"
                checked={config.DB_LOGGING}
                onChange={(e) => handleInputChange('DB_LOGGING', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="db_logging" className="text-sm font-medium text-gray-700 cursor-pointer">
                Enable SQL Query Logging
              </label>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || isSaving || !config.DB_HOST || !config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving || isTesting || !hasChanges || !config.DB_HOST || !config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>

            {/* Warning Message */}
            {hasChanges && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Important</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      After saving, you will need to restart the server for the changes to take effect.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ContentContainer>
  );
};

export default DatabaseSettings;

