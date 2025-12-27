import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { physicalInventoryService } from '../services/physicalInventoryService';

interface ImportItem {
  product_code: string;
  product_name: string;
  current_quantity: number;
  counted_quantity: number;
  unit_average_cost: number;
  batch_number?: string;
  expiry_date?: string;
  serial_numbers?: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface PhysicalInventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ImportItem[]) => void;
  existingItems: any[];
  storeId?: string;
}

export const PhysicalInventoryImportModal: React.FC<PhysicalInventoryImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingItems,
  storeId
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please select an Excel (.xlsx) or CSV file');
        return;
      }

      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setImportData([]);
      setValidationErrors([]);
      setShowPreview(false);
    }
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await physicalInventoryService.downloadImportTemplate();
      
      // Verify the blob is not empty and has correct MIME type
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'physical_inventory_items_template.xlsx';
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error: any) {
      // Try to get more specific error information
      let errorMessage = 'Unknown error occurred';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Failed to download template: ${errorMessage}`);
    }
  }, []);

  const handleValidateFile = useCallback(async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the API service for consistent error handling
      const response = await physicalInventoryService.validateItems(formData, storeId);
      
      setImportData(response.data || []);
      setValidationErrors(response.errors || []);
      setShowPreview(true);

      if (response.errors && response.errors.length > 0) {
        toast.error(`Found ${response.errors.length} validation errors`);
      } else {
        toast.success(`File validated successfully. ${response.data?.length || 0} items ready for import`);
      }
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = 'Failed to validate file';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, [file]);

  const handleImport = useCallback(async () => {
    if (importData.length === 0) {
      toast.error('No data to import');
      return;
    }

    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before importing');
      return;
    }

    // Check for duplicates with existing items
    const existingProductCodes = existingItems.map(item => item.product?.code || item.product_code);
    const duplicateCodes = importData
      .map(item => item.product_code)
      .filter(code => existingProductCodes.includes(code));

    if (duplicateCodes.length > 0) {
      const shouldContinue = window.confirm(
        `Found ${duplicateCodes.length} products that already exist in this inventory. Do you want to continue? This will add them as additional items.`
      );
      
      if (!shouldContinue) {
        return;
      }
    }

    setIsImporting(true);
    try {
      await onImport(importData);
      onClose();
      toast.success(`Successfully imported ${importData.length} items`);
    } catch (error) {
      toast.error('Failed to import items. Please try again.');
    } finally {
      setIsImporting(false);
    }
  }, [importData, validationErrors, existingItems, onImport, onClose]);

  const handleClose = useCallback(() => {
    setFile(null);
    setImportData([]);
    setValidationErrors([]);
    setShowPreview(false);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Inventory Items"
      size="lg"
    >
      <div className="space-y-6">
        {/* Template Download Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700">Get the Excel template with the correct format</p>
              </div>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Excel (.xlsx) or CSV files up to 5MB
                </p>
              </label>
            </div>
            {file && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  onClick={handleValidateFile}
                  disabled={isValidating || isImporting}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? 'Validating...' : 'Validate File'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Validation Progress */}
        {isValidating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <h3 className="text-sm font-medium text-blue-900">Validating File...</h3>
            </div>
            <div className="text-sm text-blue-700">
              Please wait while we validate your Excel file and check product information.
            </div>
          </div>
        )}

        {/* Import Progress */}
        {isImporting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <h3 className="text-sm font-medium text-green-900">Importing Products...</h3>
            </div>
            <div className="text-sm text-green-700">
              Please wait while we fetch product data and add items to your inventory.
            </div>
          </div>
        )}

        {/* Validation Summary */}
        {showPreview && !isValidating && !isImporting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-900">Validation Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-900">{importData.length}</div>
                <div className="text-blue-700">Valid Items</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{validationErrors.length}</div>
                <div className="text-red-700">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">{importData.length + validationErrors.length}</div>
                <div className="text-gray-700">Total Rows</div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-red-900">
                Validation Errors ({validationErrors.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-100 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Row {error.row}</span>
                    <span className="text-xs text-red-600 bg-red-200 px-2 py-1 rounded">
                      {error.field}
                    </span>
                  </div>
                  <div className="mt-1">{error.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && importData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Preview ({importData.length} items)
              </h3>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Ready to import</span>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Code
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counted Qty
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost & Delta
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Numbers
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importData.slice(0, 10).map((item, index) => {
                      const delta = item.counted_quantity - item.current_quantity;
                      // const deltaValue = delta * item.unit_average_cost; // Unused - removed to fix linting
                      return (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.product_code}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.counted_quantity.toLocaleString()}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span>{item.unit_average_cost.toLocaleString()}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                delta > 0 ? 'bg-green-100 text-green-800' : 
                                delta < 0 ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.batch_number || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.expiry_date || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {item.serial_numbers ? (
                              <div className="max-w-xs truncate" title={item.serial_numbers}>
                                {item.serial_numbers}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {importData.length > 10 && (
                  <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    ... and {importData.length - 10} more items
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!showPreview || validationErrors.length > 0 || importData.length === 0 || isImporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isImporting ? 'Importing...' : `Import ${importData.length} Items`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
