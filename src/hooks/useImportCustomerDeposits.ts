import { useState } from 'react';
import { importCustomerDepositsService } from '../services/importCustomerDepositsService';
import toast from 'react-hot-toast';

export interface ImportError {
  row: number;
  message: string;
}

export const useImportCustomerDeposits = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [success, setSuccess] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<any[]>([]);

  const downloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setProgress(0);
      
      await importCustomerDepositsService.downloadTemplate((progress) => {
        setProgress(progress);
      });
      
      toast.success('Customer deposits import template downloaded successfully!');
      setSuccess('Customer deposits import template downloaded successfully!');
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
      setSuccess('');
      
      const result = await importCustomerDepositsService.uploadFile(file, (progress) => {
        setProgress(progress);
      });
      
      setUploadedData(result.data);
      const successMessage = `File uploaded successfully! Found ${result.data.length} customer deposits. ${result.errors && result.errors.length > 0 ? `${result.errors.length} errors found.` : 'All data is valid.'}`;
      toast.success(successMessage);
      setSuccess(successMessage);
      
      if (result.errors.length > 0) {
        setErrors(result.errors);
        toast.error(`${result.errors.length} validation errors found. Please review and fix them.`);
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
      
      const result = await importCustomerDepositsService.importData(uploadedData, (progress) => {
        setProgress(progress);
      });
      
      const successMessage = `Import completed successfully! ${result.imported} customer deposits imported, ${result.skipped} skipped.`;
      toast.success(successMessage);
      setSuccess(successMessage);
      setUploadedData([]);
      setErrors([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import customer deposits. Please try again.';
      toast.error(message);
      setErrors([{ row: 0, message }]);
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const clearMessages = () => {
    setErrors([]);
    setSuccess('');
    setUploadedData([]);
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
    success,
    clearMessages,
    uploadedData
  };
};
