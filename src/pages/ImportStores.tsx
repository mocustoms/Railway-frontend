import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { storeService } from '../services/storeService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Progress } from '../components/ui/Progress';
import { useAuth } from '../contexts/AuthContext';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: any[];
  data: any[];
}

const ImportStores: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: (stores: any[]) => storeService.importStores(stores),
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.importedCount} stores`);
      setFile(null);
      setImportPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      navigate('/data-importation');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import stores');
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast.error('Please select a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const preview = await storeService.previewImport(formData);
      setImportPreview({
        totalRows: preview.validation.totalRows,
        validRows: preview.validation.validRows,
        invalidRows: preview.validation.invalidRows,
        errors: preview.validation.errors,
        data: preview.data
      });
      setProgress(100);
    } catch (error: any) {
      toast.error(error.message || 'Failed to preview file');
      setFile(null);
      setImportPreview(null);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!importPreview) return;
    const validStores = importPreview.data.filter((row: any) => !row._hasErrors);
    if (validStores.length === 0) {
      toast.error('No valid stores to import');
      return;
    }
    importMutation.mutate(validStores);
  };

  const downloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setProgress(0);
      const blob = await storeService.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
      setProgress(100);
    } catch (error: any) {
      toast.error('Failed to download template');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Stores</h1>
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
            Download the CSV or Excel template with the correct column structure for importing stores.
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
            Select your filled CSV or Excel file to upload and validate the store data.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              {file ? file.name : 'Choose CSV or Excel file'}
            </label>
            {file && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={removeFile}
                  className="text-sm text-red-600 hover:text-red-700 mt-1"
                >
                  Clear file
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress Section */}
      {(isUploading || importMutation.isPending) && (
        <Card className="mt-6 p-6">
          <div className="flex items-center mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isUploading ? 'Uploading File...' : 'Importing Stores...'}
            </h3>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            {progress}% complete
          </p>
        </Card>
      )}

      {/* Import Preview Section */}
      {importPreview && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
            <Button
              onClick={removeFile}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Valid Records</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {importPreview.validRows}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Invalid Records</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {importPreview.invalidRows}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Records</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {importPreview.totalRows}
              </p>
            </div>
          </div>

          {importPreview.errors.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center text-red-600 font-medium mb-3">
                <AlertCircle className="w-4 h-4 mr-2" />
                Found {importPreview.errors.length} error(s):
              </div>
              <div className="max-h-60 overflow-y-auto">
                {importPreview.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                    <p className="font-medium">
                      Row {error.row}: {error.storeName}
                    </p>
                    <ul className="mt-1 ml-4">
                      {error.errors.map((err: string, errIndex: number) => (
                        <li key={errIndex}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importPreview.validRows > 0 && (
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="w-full"
              variant="primary"
            >
              {importMutation.isPending ? 'Importing...' : `Import ${importPreview.validRows} Stores`}
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
            <span>Download the CSV or Excel template using the button above</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
            <span>Fill in your store data following the template structure</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
            <span>Save the file and upload it using the upload section</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
            <span>Review the import preview and validation errors, then fix them if needed</span>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
            <span>Click "Import Valid Stores" to complete the import</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Required fields: Store Name, Store Type, Location, Phone, Is Active</li>
            <li>Store types: pharmacy, retail_shop, restaurant, barber_shop, supermarket, clothing_store, electronics_store, hardware_store, jewelry_store, bookstore, other</li>
            <li>Boolean fields should be: true, false, yes, no, 1, 0</li>
            <li>GPS coordinates are optional but must be valid numbers if provided</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ImportStores;
