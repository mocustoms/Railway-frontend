import { useState } from 'react';
import { importSalesTransactionsService, ImportError, ImportWarning } from '../services/importSalesTransactionsService';
import toast from 'react-hot-toast';

export const useImportSalesTransactions = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const [success, setSuccess] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{
    invoicesCreated: number;
    receiptsCreated: number;
    creditTransactions: number;
  } | null>(null);

  const downloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setProgress(0);
      
      await importSalesTransactionsService.downloadTemplate((progress) => {
        setProgress(progress);
      });
      
      toast.success('Sales transactions import template downloaded successfully!');
      setSuccess('Sales transactions import template downloaded successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template. Please try again.';
      toast.error(message);
      setErrors([{ row: 0, message }]);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setProgress(0);
      setErrors([]);
      setWarnings([]);
      setSuccess('');
      setImportSummary(null);
      
      const result = await importSalesTransactionsService.uploadFile(file, (progress) => {
        setProgress(progress);
      });
      
      setUploadedData(result.data);
      setWarnings(result.warnings || []);
      
      // Build success message with warnings info
      let successMessage = `File uploaded successfully! Found ${result.data.length} transactions.`;
      if (result.errors && result.errors.length > 0) {
        successMessage += ` ${result.errors.length} errors found.`;
      }
      if (result.warnings && result.warnings.length > 0) {
        successMessage += ` ${result.warnings.length} warnings found.`;
      }
      if (!result.errors?.length && !result.warnings?.length) {
        successMessage += ' All data is valid.';
      }
      
      toast.success(successMessage);
      setSuccess(successMessage);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
        toast.error(`${result.errors.length} validation errors found. Please review and fix them.`);
      }
      
      if (result.warnings.length > 0) {
        toast.error(`${result.warnings.length} warnings found. Some optional fields are missing.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file. Please check the file format and try again.';
      toast.error(message);
      setErrors([{ row: 0, message }]);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const importData = async () => {
    try {
      setIsImporting(true);
      setProgress(0);
      
      const result = await importSalesTransactionsService.importData(uploadedData, (progress) => {
        setProgress(progress);
      });
      
      setImportSummary({
        invoicesCreated: result.invoicesCreated || 0,
        receiptsCreated: result.receiptsCreated || 0,
        creditTransactions: result.creditTransactions || 0
      });
      
      const successMessage = `Import completed successfully! ${result.imported} transactions imported, ${result.skipped} skipped. Invoices: ${result.invoicesCreated || 0}, Receipts: ${result.receiptsCreated || 0}, Credit Transactions: ${result.creditTransactions || 0}`;
      toast.success(successMessage);
      setSuccess(successMessage);
      setUploadedData([]);
      setErrors([]);
      setWarnings([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import sales transactions. Please try again.';
      toast.error(message);
      setErrors([{ row: 0, message }]);
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const clearMessages = () => {
    setErrors([]);
    setWarnings([]);
    setSuccess('');
    setUploadedData([]);
    setImportSummary(null);
  };

  return {
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
    importSummary,
    clearMessages,
    uploadedData
  };
};
