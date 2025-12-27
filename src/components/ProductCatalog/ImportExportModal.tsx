import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText,
  FileX,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ImportExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: 'excel' | 'pdf') => void;
  onImportTemplate: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  open,
  onOpenChange,
  onExport,
  onImportTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{
    imported: number;
    errors: any[];
    warnings: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setImportStatus('idle');
        setImportResults(null);
      } else {
        alert('Please select a valid Excel or CSV file.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Handle file drop
  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setImportStatus('idle');
      setImportResults(null);
    }
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) return;

    setImportStatus('uploading');
    setImportProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStatus('completed');
      
      // Simulate import results
      setImportResults({
        imported: Math.floor(Math.random() * 100) + 50,
        errors: [],
        warnings: []
      });

      // Reset after showing results
      setTimeout(() => {
        setImportStatus('idle');
        setImportResults(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (error) {
      clearInterval(progressInterval);
      setImportStatus('error');
      }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setImportStatus('idle');
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get file size in readable format
  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    } else if (file.name.endsWith('.csv')) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    return <FileX className="w-8 h-8 text-gray-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import/Export Products</h2>
            <p className="text-gray-600 mt-1">
              Import products from Excel/CSV or export to Excel/PDF
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Export Products
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Products
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Export Information</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Export your product catalog to Excel or PDF format. The export will include all products 
                      based on your current filters and search criteria.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Excel Export */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export to Excel</h3>
                    <p className="text-gray-600 mb-4">
                      Export products to Excel (.xlsx) format with all details and formatting
                    </p>
                    <button
                      onClick={() => onExport('excel')}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2 inline" />
                      Export to Excel
                    </button>
                  </div>
                </div>

                {/* PDF Export */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export to PDF</h3>
                    <p className="text-gray-600 mb-4">
                      Export products to PDF format for printing and sharing
                    </p>
                    <button
                      onClick={() => onExport('pdf')}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2 inline" />
                      Export to PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Export Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Include Images
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include product images in Excel export
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Include All Fields
                    </label>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Export all product fields and relationships
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Import Guidelines</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Before importing, please ensure your Excel file follows the required format. 
                      Download the template below to see the correct structure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Import Template</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download the Excel template with the correct column structure
                    </p>
                  </div>
                  <button
                    onClick={onImportTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 inline" />
                    Download Template
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  {!selectedFile ? (
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      className="space-y-4"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Supports Excel (.xlsx, .xls) and CSV files up to 10MB
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Choose File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-3">
                        {getFileIcon(selectedFile)}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {getFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={handleImport}
                          disabled={importStatus === 'uploading' || importStatus === 'processing'}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {importStatus === 'uploading' || importStatus === 'processing' ? (
                            'Processing...'
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2 inline" />
                              Import File
                            </>
                          )}
                        </button>
                        <button
                          onClick={removeFile}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Import Progress */}
              {importStatus === 'uploading' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-blue-800">Uploading file...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{importProgress}% complete</p>
                </div>
              )}

              {/* Import Results */}
              {importResults && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-800">Import Completed Successfully</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">{importResults.imported}</span> products imported successfully
                    </p>
                    {importResults.errors.length > 0 && (
                      <p className="text-sm text-red-600">
                        <span className="font-medium">{importResults.errors.length}</span> errors occurred
                      </p>
                    )}
                    {importResults.warnings.length > 0 && (
                      <p className="text-sm text-amber-600">
                        <span className="font-medium">{importResults.warnings.length}</span> warnings
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Import Error */}
              {importStatus === 'error' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Import Failed</h3>
                      <p className="text-sm text-red-700 mt-1">
                        An error occurred during import. Please check your file format and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Help */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">Need Help?</h3>
                    <div className="text-sm text-gray-700 mt-1 space-y-1">
                      <p>• Download the template to see the correct format</p>
                      <p>• Ensure all required fields are filled</p>
                      <p>• Check that category and unit IDs exist in the system</p>
                      <p>• Maximum file size: 10MB</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Import Documentation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
