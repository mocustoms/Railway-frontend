import React, { useState } from 'react';
import { CustomerDeposit } from '../types';
import StatusBadge from './StatusBadge';
import Button from './Button';
import { X, Download, Eye, FileText, Image, File } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { currencyService } from '../services/currencyService';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker - use local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

interface CustomerDepositViewProps {
  customerDeposit: CustomerDeposit;
  onClose: () => void;
  onEdit?: () => void;
}

const CustomerDepositView: React.FC<CustomerDepositViewProps> = ({ 
  customerDeposit, 
  onClose, 
  onEdit 
}) => {
  // State for PDF viewing
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Get system default currency
  const { data: currenciesData } = useQuery({
    queryKey: ['customer-deposit-view-currencies'],
    queryFn: () => currencyService.getCurrencies(1, 1000) // Get all currencies with high limit
  });
  
  const defaultCurrency = currenciesData?.currencies?.find(currency => currency.is_default);

  // Format currency amount with proper formatting
  const formatCurrency = (amount: number, symbol?: string) => {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${symbol || '$'}${formattedAmount}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle document download/view
  const handleDocumentAction = () => {
    if (customerDeposit.documentPath) {
      const fileExtension = customerDeposit.documentPath.split('.').pop()?.toLowerCase();
      
      // Check if it's a PDF
      if (fileExtension === 'pdf') {
        setShowPdfViewer(true);
        setPdfError(null);
      } else {
        // For non-PDF files, open in new tab
        const documentUrl = `http://localhost:3000/uploads/customer-deposits/${customerDeposit.documentPath}`;
        window.open(documentUrl, '_blank');
      }
    }
  };

  // PDF event handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    setPdfError('Failed to load PDF document');
  };

  // Get file icon based on extension
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get file type label
  const getFileTypeLabel = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      case 'webp':
        return 'WebP Image';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet';
      default:
        return 'Document';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Customer Deposit Details
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Reference: {customerDeposit.depositReferenceNumber}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-1"
            >
              <Eye className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </Button>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Customer Name
            </label>
            <p className="text-gray-900 font-medium">
              {customerDeposit.customer?.full_name || '-'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Customer ID
            </label>
            <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-md">
              {customerDeposit.customer?.customer_id || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Payment Type
            </label>
            <p className="text-gray-900 font-medium">
              {customerDeposit.paymentType?.name || '-'}
            </p>
          </div>
          
          {customerDeposit.chequeNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Cheque Number
              </label>
              <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-md">
                {customerDeposit.chequeNumber}
              </p>
            </div>
          )}
          
          {customerDeposit.bankDetail && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Bank
              </label>
              <p className="text-gray-900">
                {customerDeposit.bankDetail.bankName}
              </p>
            </div>
          )}
          
          {customerDeposit.branch && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Branch
              </label>
              <p className="text-gray-900">
                {customerDeposit.branch}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Currency
            </label>
            <p className="text-gray-900 font-medium">
              {customerDeposit.currency?.code} - {customerDeposit.currency?.name}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Exchange Rate
            </label>
            <p className="text-gray-900 font-mono text-sm bg-white px-3 py-2 rounded-md">
              {customerDeposit.exchangeRate || 1.0}
            </p>
          </div>
          
           <div>
             <label className="block text-sm font-medium text-gray-500 mb-1">
               Deposit Amount
             </label>
             <p className="text-gray-900 font-semibold text-lg">
               {formatCurrency(customerDeposit.depositAmount, customerDeposit.currency?.symbol)}
             </p>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-500 mb-1">
               Equivalent Amount (System Currency)
             </label>
             <p className="text-gray-900 font-semibold text-lg text-green-600">
               {formatCurrency(customerDeposit.equivalentAmount || 0, defaultCurrency?.symbol)}
             </p>
           </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Liability Account
            </label>
            <p className="text-gray-900">
              {customerDeposit.liabilityAccount?.name || '-'}
            </p>
            {customerDeposit.liabilityAccount?.code && (
              <p className="text-sm text-gray-500 font-mono">
                Code: {customerDeposit.liabilityAccount.code}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Asset Account
            </label>
            <p className="text-gray-900">
              {customerDeposit.assetAccount?.name || '-'}
            </p>
            {customerDeposit.assetAccount?.code && (
              <p className="text-sm text-gray-500 font-mono">
                Code: {customerDeposit.assetAccount.code}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Information */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Transaction Date
            </label>
            <p className="text-gray-900 font-medium">
              {formatDate(customerDeposit.transactionDate)}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Status
            </label>
            <StatusBadge 
              status={customerDeposit.is_active ? 'active' : 'inactive'} 
            />
          </div>
          
          {customerDeposit.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Description
              </label>
              <p className="text-gray-900 bg-white p-3 rounded-md">
                {customerDeposit.description}
              </p>
            </div>
          )}
        </div>
      </div>

       {/* Document Information */}
       {customerDeposit.documentPath && (
         <div className="bg-indigo-50 rounded-lg p-4">
           <h3 className="text-lg font-medium text-indigo-900 mb-4">📄 Attached Document</h3>
           <div className="space-y-4">
             {/* Document Info */}
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 {getFileIcon(customerDeposit.documentPath)}
                 <div>
                   <p className="text-gray-900 font-medium text-sm">
                     {getFileTypeLabel(customerDeposit.documentPath)}
                   </p>
                   <p className="text-gray-600 text-xs font-mono bg-white px-2 py-1 rounded border">
                     {customerDeposit.documentPath}
                   </p>
                 </div>
               </div>
               <div className="flex space-x-2">
                 <Button
                   variant="primary"
                   size="sm"
                   onClick={handleDocumentAction}
                   className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                 >
                   <Eye className="h-4 w-4" />
                   <span>View Document</span>
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     const documentUrl = `http://localhost:3000/uploads/customer-deposits/${customerDeposit.documentPath}`;
                     window.open(documentUrl, '_blank');
                   }}
                   className="flex items-center space-x-2"
                 >
                   <Download className="h-4 w-4" />
                   <span>Download</span>
                 </Button>
               </div>
             </div>

             {/* PDF Viewer */}
             {showPdfViewer && (
               <div className="border-t pt-4">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-md font-medium text-indigo-900">PDF Viewer</h4>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowPdfViewer(false)}
                     className="flex items-center space-x-1"
                   >
                     <X className="h-4 w-4" />
                     <span>Close</span>
                   </Button>
                 </div>
                 
                 {pdfError ? (
                   <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                     <p className="text-red-600 font-medium">{pdfError}</p>
                     <p className="text-red-500 text-sm mt-1">
                       Unable to display PDF. Try downloading the file instead.
                     </p>
                   </div>
                 ) : (
                   <div className="bg-white border rounded-lg p-4">
                     {/* PDF Controls */}
                     {numPages && (
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                             disabled={pageNumber <= 1}
                           >
                             Previous
                           </Button>
                           <span className="text-sm text-gray-600">
                             Page {pageNumber} of {numPages}
                           </span>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                             disabled={pageNumber >= numPages}
                           >
                             Next
                           </Button>
                         </div>
                         <div className="text-sm text-gray-500">
                           {customerDeposit.documentPath}
                         </div>
                       </div>
                     )}
                     
                     {/* PDF Document */}
                     <div className="flex justify-center">
                       <Document
                         file={`http://localhost:3000/uploads/customer-deposits/${customerDeposit.documentPath}`}
                         onLoadSuccess={onDocumentLoadSuccess}
                         onLoadError={onDocumentLoadError}
                         loading={
                           <div className="flex items-center justify-center p-8">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                             <span className="ml-2 text-gray-600">Loading PDF...</span>
                           </div>
                         }
                       >
                         <Page
                           pageNumber={pageNumber}
                           width={600}
                           renderTextLayer={true}
                           renderAnnotationLayer={true}
                         />
                       </Document>
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>
       )}

    </div>
  );
};

export default CustomerDepositView;
