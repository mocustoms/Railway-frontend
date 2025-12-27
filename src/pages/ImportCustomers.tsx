import React, { useState, useRef } from 'react';
import { useImportCustomers } from '../hooks/useImportCustomers';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Progress } from '../components/ui/Progress';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ImportCustomers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const {
    downloadTemplate,
    uploadFile,
    importData,
    isDownloading,
    isUploading,
    isImporting,
    progress,
    errors,
    warnings,
    success,
    clearMessages
  } = useImportCustomers();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      clearMessages(); // This will also clear uploadedData
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadFile(selectedFile);
      // Reset file input after upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    await importData();
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/data-importation')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Data Importation
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Customers</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Template Section */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Download className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Download Template</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Download the Excel template with the correct column structure for importing customers.
          </p>
          <Button
            onClick={downloadTemplate}
            disabled={isDownloading}
            className="w-full"
            variant="primary"
          >
            {isDownloading ? 'Downloading...' : 'Download Template'}
          </Button>
        </Card>

        {/* Upload File Section */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Select your filled Excel file to upload and validate the customer data.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedFile ? selectedFile.name : 'Choose Excel file'}
            </label>
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-2">
                File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-4"
              variant="primary"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          )}
        </Card>
      </div>

      {/* Progress Section */}
      {(isUploading || isImporting) && (
        <Card className="mt-6 p-6">
          <div className="flex items-center mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isUploading ? 'Uploading File...' : 'Importing Customers...'}
            </h3>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            {progress}% complete
          </p>
        </Card>
      )}

      {/* Messages Section */}
      {(errors.length > 0 || warnings.length > 0 || success) && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
            <Button
              onClick={clearMessages}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {success && (
            <Alert variant="success" className="mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </Alert>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-orange-600 font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                Found {warnings.length} warning(s) - Optional fields missing:
              </div>
              <div className="max-h-60 overflow-y-auto">
                {warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Row {warning.row} ({warning.customer}): {warning.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                Found {errors.length} error(s):
              </div>
              <div className="max-h-60 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Row {error.row}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length === 0 && success && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full mt-4"
              variant="primary"
            >
              {isImporting ? 'Importing...' : 'Import Valid Customers'}
            </Button>
          )}
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
            <span>Download the Excel template using the button above</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
            <span>Fill in your customer data following the template structure</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
            <span>Save the file and upload it using the upload section</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
            <span>Review any validation errors and fix them if needed</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
            <span>Click "Import Valid Customers" to complete the import</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportCustomers;
