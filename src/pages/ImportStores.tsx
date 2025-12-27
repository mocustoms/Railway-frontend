import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { storeService } from '../services/storeService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: any[];
  data: any[];
}

const ImportStores: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      navigate('/advance-setup/store');
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
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to preview file');
      setFile(null);
    } finally {
      setIsUploading(false);
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
    } catch (error: any) {
      toast.error('Failed to download template');
    }
  };

  const removeFile = () => {
    setFile(null);
    setImportPreview(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/advance-setup/store')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Store Setup</span>
            </button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Import Stores</h1>
            <p className="text-gray-600">Import stores from CSV or Excel file</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your CSV or Excel file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? 'Processing...' : 'Choose File'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {showPreview && importPreview && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Import Preview</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      {importPreview.validRows} valid rows
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600">
                      {importPreview.invalidRows} invalid rows
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Valid Records</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {importPreview.validRows}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Invalid Records</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {importPreview.invalidRows}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Total Records</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {importPreview.totalRows}
                  </p>
                </div>
              </div>

              {importPreview.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Validation Errors</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {importPreview.errors.map((error, index) => (
                      <div key={index} className="mb-3 last:mb-0">
                        <p className="text-sm font-medium text-red-900">
                          Row {error.row}: {error.storeName}
                        </p>
                        <ul className="text-sm text-red-700 mt-1">
                          {error.errors.map((err: string, errIndex: number) => (
                            <li key={errIndex} className="ml-4">• {err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={removeFile}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importPreview.validRows === 0 || importMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {importMutation.isPending ? 'Importing...' : `Import ${importPreview.validRows} Stores`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Import Instructions</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• Download the template to see the required format and field descriptions</p>
            <p>• Required fields: Store Name, Store Type, Location, Phone, Is Active</p>
            <p>• Store types: pharmacy, retail_shop, restaurant, barber_shop, supermarket, clothing_store, electronics_store, hardware_store, jewelry_store, bookstore, other</p>
            <p>• Boolean fields should be: true, false, yes, no, 1, 0</p>
            <p>• GPS coordinates are optional but must be valid numbers if provided</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStores; 