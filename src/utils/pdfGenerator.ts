import jsPDF from 'jspdf';

import { autoTable } from 'jspdf-autotable'

// applyPlugin(jsPDF)

interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  country?: string;
  region?: string;
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  companyDetails: CompanyDetails;
  logoUrl?: string;
  generatedBy?: string;
  generatedOn: string;
  filters?: any;
  searchTerm?: string;
  reportType?: 'current' | 'historical';
}

export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private autoTable = autoTable;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF('l', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15; // Reduced margin for more content space
  }

  // Load image as data URL for PDF embedding
  private async loadImageAsDataURL(imagePath: string): Promise<string | null> {
    try {
      // Convert relative path to full URL
      const fullUrl = imagePath.startsWith('http') ? imagePath : `${window.location.origin}${imagePath}`;
      // Loading image from URL

      // Fetch the image
      const response = await fetch(fullUrl);
      if (!response.ok) {
        // Failed to fetch image
        return null;
      }

      // Check if response is actually an image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        // Response is not an image
        return null;
      }

      // Convert to blob
      const blob = await response.blob();
      // Image blob loaded

      // Convert blob to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Image converted to data URL
          resolve(dataUrl);
        };
        reader.onerror = () => {
          // Failed to convert image to data URL
          reject(new Error('Failed to convert image to data URL'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // Error loading image
      return null;
    }
  }

  // Generate professional header with company logo and details
  private async generateHeader(options: PDFOptions): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { companyDetails, logoUrl, title, subtitle } = options;
    console.log('logo url:', logoUrl);
    const img = document.getElementById('company-logo') as HTMLImageElement;
    console.log('logo img:', img);
    this.doc.setFontSize(16);
    this.doc.setTextColor(41, 128, 185);
    this.doc.setFont('helvetica', 'bold');
    if (img) {
      this.doc.addImage(img, 'PNG', this.margin, 5, 10, 10);
    }

    // Company name
    this.doc.setFontSize(20);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(companyDetails.name, this.margin, 25);

    // Company details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);

    let yPosition = 30;
    if (companyDetails.address) {
      const address = companyDetails.address.replace(/\s+/g, ' ').trim();
      const availableWidth = this.pageWidth - this.margin * 2;
      let displayAddress = address;
      if (this.doc.getTextWidth(displayAddress) > availableWidth) {
        while (displayAddress.length > 0 && this.doc.getTextWidth(displayAddress + '...') > availableWidth) {
          displayAddress = displayAddress.slice(0, -1);
        }
        displayAddress = `${displayAddress}...`;
      }
      this.doc.text(displayAddress, this.margin, yPosition);
      // yPosition += 10;
      // this.doc.text(companyDetails.address, this.margin, yPosition);
      yPosition += 5;
    }

    this.doc.text(`${companyDetails.region}, ${companyDetails.country}`, this.margin, yPosition);
    yPosition += 5;

    // Add country and region if available
    // const locationParts = [];
    // if (companyDetails.region) {
    //   locationParts.push(companyDetails.region);
    // }
    // if (companyDetails.country) {
    //   locationParts.push(companyDetails.country);
    // }
    // if (locationParts.length > 0) {  
    // this.doc.text(`${companyDetails.region}, ${companyDetails.country}`, this.margin, yPosition);
    // yPosition += 5;
    // }

    if (companyDetails.phone) {
      this.doc.text(`Tel: ${companyDetails.phone}`, this.margin, yPosition);
      yPosition += 5;
    }
    if (companyDetails.email) {
      this.doc.text(`Email: ${companyDetails.email}`, this.margin, yPosition);
      yPosition += 5;
    }
    if (companyDetails.website) {
      this.doc.text(`Web: ${companyDetails.website}`, this.margin, yPosition);
      yPosition += 5;
    }

    // Report title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin, yPosition + 10);

    // Report subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, yPosition + 16);
    }

    // Generated info
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Generated on: ${options.generatedOn}`, this.pageWidth - this.margin - 50, 15);
    if (options.generatedBy) {
      this.doc.text(`Generated by: ${options.generatedBy}`, this.pageWidth - this.margin - 50, 20);
    }

    // Draw line separator
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, yPosition + 20, this.pageWidth - this.margin, yPosition + 20);
  }

  // Generate professional table using basic jsPDF methods
  public async generateTable(
    headers: string[],
    data: any[][],
    options: PDFOptions,
    tableTitle?: string,
    columnType?: 'stock' | 'customer' | 'birthday'
  ): Promise<void> {
    // Generate header first
    await this.generateHeader(options);


    // Table title
    let startY = 80;
    if (tableTitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(tableTitle, this.margin, startY);
      startY += 10;
    }

    let totalValue = 0;
    let totalQuantity = 0;

    let footer = [{ content: totalQuantity.toString(), colSpan: 1 }, { content: totalValue.toString(), colSpan: 1 }, { content: totalValue.toString(), colSpan: 1 }];

    this.autoTable(this.doc, {
      head: [headers],
      body: data,
      foot: [
       [{ content: 'Total', colSpan: columnType === 'stock' ? headers.length - 2 : columnType === 'customer' ? headers.length - 1 : 0 },...footer],
      ],
      startY: startY,
    })


    // // this.doc.addHtml()

    // // Calculate dynamic column widths based on ALL content for accurate sizing
    // const tableWidth = this.pageWidth - (this.margin * 2);

    // // Use ALL data to calculate optimal widths (not just sample)
    // const allData = data;

    // // Calculate optimal column widths considering text wrapping
    // const maxWidths = headers.map((_, colIndex) => {
    //   let maxWidth = 0;

    //   // Check header width
    //   this.doc.setFontSize(8);
    //   const headerWidth = this.doc.getTextWidth(headers[colIndex]);
    //   maxWidth = Math.max(maxWidth, headerWidth);

    //   // For text columns, calculate width based on longest word, not entire text
    //   this.doc.setFontSize(7);
    //   allData.forEach(row => {
    //     const cellText = String(row[colIndex] || '--');

    //     // For text columns (not numeric), find the longest word
    //     if (colIndex < 9) { // Text columns (Product Code, Name, Part Number, etc.)
    //       const words = cellText.split(' ');
    //       words.forEach(word => {
    //         const wordWidth = this.doc.getTextWidth(word);
    //         maxWidth = Math.max(maxWidth, wordWidth);
    //       });
    //     } else {
    //       // For numeric columns, use full text width
    //       const cellWidth = this.doc.getTextWidth(cellText);
    //       maxWidth = Math.max(maxWidth, cellWidth);
    //     }
    //   });

    //   // Set minimum widths for different column types to better utilize page width
    //   let minWidth = 16;

    //   if (columnType === 'customer') {
    //     // Customer List specific column widths
    //     if (colIndex === 0) minWidth = 25; // Customer ID
    //     else if (colIndex === 1) minWidth = 40; // Full Name - wider for better readability
    //     else if (colIndex === 2) minWidth = 30; // Customer Group
    //     else if (colIndex === 3) minWidth = 25; // Phone
    //     else if (colIndex === 4) minWidth = 35; // Email
    //     else if (colIndex === 5) minWidth = 30; // Website
    //     else if (colIndex === 6) minWidth = 25; // Fax
    //     else if (colIndex === 7) minWidth = 25; // Birthday
    //     else if (colIndex === 8) minWidth = 30; // Loyalty Card
    //     else if (colIndex === 9) minWidth = 25; // Loyalty Card Points
    //     else if (colIndex === 10) minWidth = 50; // Address - wider for addresses
    //     else if (colIndex === 11) minWidth = 25; // Account Balance
    //     else minWidth = 22; // Default for other columns
    //   } else if (columnType === 'birthday') {
    //     // Customer Birthdays specific column widths
    //     if (colIndex === 0) minWidth = 25; // Customer ID
    //     else if (colIndex === 1) minWidth = 40; // Full Name - wider for better readability
    //     else if (colIndex === 2) minWidth = 25; // Phone
    //     else if (colIndex === 3) minWidth = 50; // Address - wider for addresses
    //     else if (colIndex === 4) minWidth = 20; // Days Left
    //     else if (colIndex === 5) minWidth = 25; // Birthday
    //     else if (colIndex === 6) minWidth = 30; // Customer Group
    //     else if (colIndex === 7) minWidth = 30; // Loyalty Card
    //     else minWidth = 22; // Default for other columns
    //   } else {
    //     // Stock Balance specific column widths (default)
    //     if (colIndex === 1) minWidth = 45; // Product Name - wider for better readability
    //     else if (colIndex === 2) minWidth = 28; // Part Number - slightly wider
    //     else if (colIndex >= 9) minWidth = 22; // Numeric columns - wider for better alignment
    //     else minWidth = 22; // Other text columns - wider for better readability
    //   }

    //   return Math.max(maxWidth + 8, minWidth);
    // });

    // // Calculate total required width
    // const totalRequiredWidth = maxWidths.reduce((sum, width) => sum + width, 0);

    // // Use more of the available width for better page utilization
    // const scaleFactor = totalRequiredWidth > tableWidth ? (tableWidth * 0.99) / totalRequiredWidth : 1;
    // const colWidths = maxWidths.map(width => Math.max(width * scaleFactor, 18)); // Slightly reduced minimum width

    // const baseRowHeight = 6;
    // let currentY = startY;

    // // Draw table header
    // this.doc.setFillColor(41, 128, 185); // Blue background
    // this.doc.rect(this.margin, currentY, tableWidth, baseRowHeight, 'F');

    // this.doc.setTextColor(255, 255, 255); // White text
    // this.doc.setFont('helvetica', 'bold');
    // this.doc.setFontSize(8); // Reduced font size to match data rows

    // let xPos = this.margin;
    // headers.forEach((header, index) => {
    //   this.doc.text(header, xPos + 1, currentY + 4);
    //   xPos += colWidths[index];
    // });

    // currentY += baseRowHeight;

    // // Draw table rows
    // this.doc.setTextColor(0, 0, 0); // Black text
    // this.doc.setFont('helvetica', 'normal');
    // this.doc.setFontSize(7); // Reduced font size to fit more content

    // data.forEach((row, rowIndex) => {
    //   // Calculate row height based on content wrapping
    //   let maxRowHeight = baseRowHeight;
    //   const wrappedTexts: string[][] = [];

    //   // Pre-calculate wrapped text for all cells in this row
    //   row.forEach((cell, colIndex) => {
    //     const colWidth = colWidths[colIndex];
    //     const cellText = String(cell || '--');

    //     // Wrap text to fit column width with reduced padding for better space utilization
    //     const wrappedLines = this.wrapText(cellText, colWidth - 2); // Reduced padding from 3 to 2
    //     wrappedTexts.push(wrappedLines);

    //     // Calculate row height based on number of lines
    //     const lineHeight = 4;
    //     const cellHeight = wrappedLines.length * lineHeight;
    //     maxRowHeight = Math.max(maxRowHeight, cellHeight);
    //   });

    //   // Check if we need a new page (adjusted for landscape)
    //   if (currentY + maxRowHeight > this.pageHeight - 40) {
    //     this.doc.addPage();
    //     currentY = 20;
    //   }

    //   // Alternate row colors
    //   if (rowIndex % 2 === 0) {
    //     this.doc.setFillColor(245, 245, 245); // Light gray
    //     this.doc.rect(this.margin, currentY, tableWidth, maxRowHeight, 'F');
    //   }

    //   // Draw cell borders and content with wrapping
    //   xPos = this.margin;
    //   wrappedTexts.forEach((wrappedLines, colIndex) => {
    //     // Draw cell border
    //     this.doc.setDrawColor(200, 200, 200);
    //     this.doc.rect(xPos, currentY, colWidths[colIndex], maxRowHeight);

    //     // Draw each line of wrapped text
    //     wrappedLines.forEach((line, lineIndex) => {
    //       const textY = currentY + (lineIndex * 4) + 3;

    //       // Right align numeric columns with optimized positioning
    //       if (colIndex >= 9) { // Quantity, Unit Cost, Total Value
    //         this.doc.text(line, xPos + colWidths[colIndex] - 1, textY, { align: 'right' });
    //       } else {
    //         this.doc.text(line, xPos + 1, textY);
    //       }
    //     });

    //     xPos += colWidths[colIndex];
    //   });

    //   currentY += maxRowHeight;
    // });

    // // Draw table borders
    // this.doc.setDrawColor(200, 200, 200);
    // this.doc.setLineWidth(0.1);

    // // Vertical lines
    // xPos = this.margin;
    // for (let i = 0; i <= colWidths.length; i++) {
    //   this.doc.line(xPos, startY, xPos, currentY);
    //   if (i < colWidths.length) {
    //     xPos += colWidths[i];
    //   }
    // }

    // // Horizontal lines - draw at header and after each row
    // this.doc.line(this.margin, startY, this.margin + tableWidth, startY); // Header top
    // this.doc.line(this.margin, startY + baseRowHeight, this.margin + tableWidth, startY + baseRowHeight); // Header bottom

    // // Draw horizontal lines for each data row
    // let lineY = startY + baseRowHeight;
    // data.forEach((row, rowIndex) => {
    //   // Calculate row height for this specific row
    //   let maxRowHeight = baseRowHeight;
    //   row.forEach((cell, colIndex) => {
    //     const colWidth = colWidths[colIndex];
    //     const cellText = String(cell || '--');
    //     const wrappedLines = this.wrapText(cellText, colWidth - 2);
    //     const cellHeight = wrappedLines.length * 4;
    //     maxRowHeight = Math.max(maxRowHeight, cellHeight);
    //   });

    //   lineY += maxRowHeight;
    //   this.doc.line(this.margin, lineY, this.margin + tableWidth, lineY);
    // });

    // // Add totals row
    // currentY = this.addTotalsRow(data, colWidths, currentY, options, columnType, headers);

    // // Store final Y position for summary
    // (this.doc as any).lastTableY = currentY;
  }

  // Add totals row to the table
  private addTotalsRow(data: any[][], colWidths: number[], currentY: number, options: PDFOptions, columnType?: 'stock' | 'customer' | 'birthday', headers?: any[]): number {
    // Calculate totals based on column type
    let totalQuantity = 0;
    let totalValue = 0;

    if (columnType === 'stock') {
      // Stock Balance totals
      totalQuantity = data.reduce((sum, row) => {
        const index = headers?.indexOf('quantity') || 9;
        const quantityStr = row[index]; // Quantity column index
        const quantity = parseFloat((quantityStr || '0').toString().replace(/,/g, '')) || 0;
        return sum + quantity;
      }, 0);

      totalValue = data.reduce((sum, row) => {
        const valueStr = row[11]; // Total Value column index
        const value = parseFloat((valueStr || '0').toString().replace(/,/g, '')) || 0;
        return sum + value;
      }, 0);
    } else if (columnType === 'customer') {
      // Customer List totals - sum account balances
      totalValue = data.reduce((sum, row) => {
        const valueStr = row[11]; // Account Balance column index
        const value = parseFloat((valueStr || '0').toString().replace(/,/g, '')) || 0;
        return sum + value;
      }, 0);
    }
    // For birthday reports, we don't need totals

    // Create totals row data based on column type
    const totalsRow = colWidths.map((_, colIndex) => {
      if (colIndex === 0) return 'Total';

      if (columnType === 'stock') {
        if (colIndex === 9) return totalQuantity.toLocaleString(); // Quantity
        else if (colIndex === 11) return totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // Total Value
        else return ''; // Empty for other columns
      } else if (columnType === 'customer') {
        if (colIndex === 11) return totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // Account Balance
        else return ''; // Empty for other columns
      } else {
        // For birthday reports, no totals needed
        return '';
      }
    });

    // Draw totals row background
    const totalsRowHeight = 6;
    this.doc.setFillColor(240, 248, 255); // Light blue background
    this.doc.rect(this.margin, currentY, colWidths.reduce((sum, width) => sum + width, 0), totalsRowHeight, 'F');

    // Draw totals row content
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);

    let xPos = this.margin;
    totalsRow.forEach((cell, colIndex) => {
      // Draw cell border
      this.doc.setDrawColor(200, 200, 200);
      this.doc.rect(xPos, currentY, colWidths[colIndex], totalsRowHeight);

      // Draw cell content
      if (cell) {
        if (colIndex >= 9) { // Numeric columns - right align
          this.doc.text(cell, xPos + colWidths[colIndex] - 1, currentY + 4, { align: 'right' });
        } else { // Text columns - left align
          this.doc.text(cell, xPos + 1, currentY + 4);
        }
      }

      xPos += colWidths[colIndex];
    });

    // Draw bottom border for totals row
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, currentY + totalsRowHeight, this.margin + colWidths.reduce((sum, width) => sum + width, 0), currentY + totalsRowHeight);

    // Return new Y position
    return currentY + totalsRowHeight;
  }

  // Helper method to wrap text to fit column width
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.doc.getTextWidth(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word is too long, try to break it
          if (word.length > 10) { // Reduced threshold for breaking words
            // Break long words more aggressively
            let remainingWord = word;
            while (remainingWord.length > 0) {
              let breakPoint = Math.min(remainingWord.length, Math.floor(maxWidth / 2.5)); // More aggressive breaking
              while (breakPoint > 0 && this.doc.getTextWidth(remainingWord.substring(0, breakPoint)) > maxWidth) {
                breakPoint--;
              }
              if (breakPoint === 0) breakPoint = 1; // Force at least 1 character
              lines.push(remainingWord.substring(0, breakPoint));
              remainingWord = remainingWord.substring(breakPoint);
            }
          } else {
            lines.push(word);
          }
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : ['--'];
  }

  // Save PDF
  public save(filename: string): void {
    this.doc.save(filename);
  }

  // Get PDF as blob for download
  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  // Create a simple PDF with just a message
  public createSimplePDF(title: string, message: string): void {
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin, 30);
    this.doc.setFontSize(14);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(message, this.margin, 50);
  }
}

// Helper function to generate stock balance PDF
export const generateStockBalancePDF = async (
  exportData: {
    data: any[];
    filters: any;
    searchTerm?: string;
    visibleColumns?: any;
    sortConfig?: any;
    reportType: 'current' | 'historical';
  }
): Promise<Blob> => {
  const generator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  try {
    // Use the configured API service for proper authentication
    const api = (await import('../services/api')).default;
    const response = await api.get('/company');

    if (response.data.success && response.data.data) {
      const company = response.data.data;
      companyDetails = {
        name: company.name || 'EasyMauzo Company',
        address: company.address || '123 Business Street, City, Country',
        phone: company.phone || '+1 (555) 123-4567',
        email: company.email || 'info@easymauzo.com',
        website: company.website || 'www.easymauzo.com',
        logo: company.logo || undefined,
        country: company.country || 'Tanzania',
        region: company.region || 'Dar es Salaam'
      };
      // Company details fetched successfully
    } else {
      // No company data found in response
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // PDF options
  const options: PDFOptions = {
    title: exportData.reportType === 'current' ? 'Stock Balance Report' : 'Stock Balance as of Date Report',
    subtitle: exportData.reportType === 'historical' && exportData.filters.asOfDate
      ? `As of ${new Date(exportData.filters.asOfDate).toLocaleDateString()}`
      : 'Current Stock Levels',
    companyDetails,
    logoUrl: companyDetails.logo || '/images/logo.png', // Use company logo if available
    generatedBy: 'System Administrator',
    generatedOn: new Date().toLocaleString(),
    filters: exportData.filters,
    searchTerm: exportData.searchTerm,
    reportType: exportData.reportType
  };

  // Prepare table data - show ALL available columns for complete report

  const allHeaders = [
    { label: 'Product Code', key: 'productCode' },
    { label: 'Product Name', key: 'productName' },
    { label: 'Part Number', key: 'partNumber' },
    { label: 'Brand', key: 'brandName' }, { label: 'Category', key: 'category' },
    { label: 'Manufacturer', key: 'manufacturerName' },
    { label: 'Model', key: 'modelName' },
    { label: 'Color', key: 'colorName' },
    { label: 'Location', key: 'storeLocation' },
    { label: 'Unit Cost', key: 'unitCost' },
    { label: 'Quantity', key: 'quantity' },
    { label: 'Total Value', key: 'totalValue' },
  ];

  // Use all columns for complete report
  const visibleHeaders = allHeaders.filter(header => exportData.visibleColumns ? exportData.visibleColumns[header.key] : true);
  const visibleDataKeys = visibleHeaders.map(header => header.key);
  const visibleDataLabels = visibleHeaders.map(header => header.label);

  const tableData = exportData.data.map(item =>
    visibleDataKeys.map(key => {
      const value = item[key];
      if (key === 'quantity') {
        return (value || 0).toLocaleString();
      } else if (key === 'unitCost' || key === 'totalValue') {
        return (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (key === 'lastUpdated') {
        return value ? new Date(value).toLocaleDateString() : '--';
      }
      return value || '--';
    })
  );

  // Generate table
  await generator.generateTable(visibleDataLabels, tableData, options, 'Stock Balance Details', 'stock');

  // Calculate totals for table footer (already handled in generateTable)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalQuantity = exportData.data.reduce((sum, item) => sum + (item.quantity || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalValue = exportData.data.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  // No separate summary section needed - totals are shown in table footer

  return generator.getBlob();
};

// Helper function to generate customer list PDF
export const generateCustomerListPDF = async (
  exportData: {
    data: any[];
    filters: any;
    searchTerm?: string;
    visibleColumns?: any;
    sortConfig?: any;
    reportType: 'current' | 'historical';
  }
): Promise<Blob> => {
  const generator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  try {
    // Use the configured API service for proper authentication
    const api = (await import('../services/api')).default;
    const response = await api.get('/company');

    if (response.data.success && response.data.data) {
      const company = response.data.data;
      companyDetails = {
        name: company.name || 'EasyMauzo Company',
        address: company.address || '123 Business Street, City, Country',
        phone: company.phone || '+1 (555) 123-4567',
        email: company.email || 'info@easymauzo.com',
        website: company.website || 'www.easymauzo.com',
        logo: company.logo || undefined,
        country: company.country || 'Tanzania',
        region: company.region || 'Dar es Salaam'
      };
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // PDF options
  const options: PDFOptions = {
    title: 'Customer List Report',
    subtitle: 'Complete Customer Information',
    companyDetails,
    logoUrl: companyDetails.logo || '/images/logo.png',
    generatedBy: 'System Administrator',
    generatedOn: new Date().toLocaleString(),
    filters: exportData.filters,
    searchTerm: exportData.searchTerm,
    reportType: exportData.reportType
  };

  // Prepare table data - show ALL available columns for complete report
  const allHeaders = [
    'Customer ID',
    'Full Name',
    'Customer Group',
    'Phone',
    'Email',
    'Website',
    'Fax',
    'Birthday',
    'Loyalty Card',
    'Loyalty Card Points',
    'Address',
    'Account Balance'
  ];

  const allDataKeys = [
    'customerId',
    'fullName',
    'customerGroup',
    'phone',
    'email',
    'website',
    'fax',
    'birthday',
    'loyaltyCard',
    'loyaltyCardPoints',
    'address',
    'accountBalance'
  ];

  // Use all columns for complete report
  const visibleHeaders = allHeaders;
  const visibleDataKeys = allDataKeys;

  // Safety check for empty data
  if (!exportData.data || exportData.data.length === 0) {
    // Generate a simple PDF with just a message
    generator.createSimplePDF('Customer List Report', 'No customer data available for the selected criteria.');
    return generator.getBlob();
  }

  const tableData = exportData.data.map(item =>
    visibleDataKeys.map(key => {
      const value = item[key];
      if (key === 'accountBalance') {
        return (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else if (key === 'loyaltyCardPoints') {
        return (value || 0).toLocaleString();
      } else if (key === 'birthday') {
        return value ? new Date(value).toLocaleDateString() : '--';
      }
      return value || '--';
    })
  );

  // Generate table
  await generator.generateTable(visibleHeaders, tableData, options, 'Customer Details', 'customer');

  return generator.getBlob();
};

// Helper function to generate customer birthdays PDF
export const generateCustomerBirthdaysPDF = async (
  exportData: {
    data: any[];
    filters: any;
    searchTerm?: string;
    visibleColumns?: any;
    sortConfig?: any;
    reportType: 'current' | 'historical';
  }
): Promise<Blob> => {
  const generator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  try {
    // Use the configured API service for proper authentication
    const api = (await import('../services/api')).default;
    const response = await api.get('/company');

    if (response.data.success && response.data.data) {
      const company = response.data.data;
      companyDetails = {
        name: company.name || 'EasyMauzo Company',
        address: company.address || '123 Business Street, City, Country',
        phone: company.phone || '+1 (555) 123-4567',
        email: company.email || 'info@easymauzo.com',
        website: company.website || 'www.easymauzo.com',
        logo: company.logo || undefined,
        country: company.country || 'Tanzania',
        region: company.region || 'Dar es Salaam'
      };
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // PDF options
  const options: PDFOptions = {
    title: 'Customer Birthdays Report',
    subtitle: `Upcoming Birthdays (${exportData.filters.daysBefore || 30} days)`,
    companyDetails,
    logoUrl: companyDetails.logo || '/images/logo.png',
    generatedBy: 'System Administrator',
    generatedOn: new Date().toLocaleString(),
    filters: exportData.filters,
    searchTerm: exportData.searchTerm,
    reportType: exportData.reportType
  };

  // Prepare table data - show ALL available columns for complete report
  const allHeaders = [
    'Customer ID',
    'Full Name',
    'Phone',
    'Address',
    'Days Left',
    'Birthday',
    'Customer Group',
    'Loyalty Card'
  ];

  const allDataKeys = [
    'customerId',
    'fullName',
    'phone',
    'address',
    'daysLeft',
    'birthday',
    'customerGroup',
    'loyaltyCard'
  ];

  // Use all columns for complete report
  const visibleHeaders = allHeaders;
  const visibleDataKeys = allDataKeys;

  // Safety check for empty data
  if (!exportData.data || exportData.data.length === 0) {
    // Generate a simple PDF with just a message
    generator.createSimplePDF('Customer Birthdays Report', 'No customer birthdays data available for the selected criteria.');
    return generator.getBlob();
  }

  const tableData = exportData.data.map(item =>
    visibleDataKeys.map(key => {
      const value = item[key];
      if (key === 'daysLeft') {
        return (value || 0).toString();
      } else if (key === 'birthday') {
        return value ? new Date(value).toLocaleDateString() : '--';
      }
      return value || '--';
    })
  );

  // Generate table
  await generator.generateTable(visibleHeaders, tableData, options, 'Customer Birthdays', 'birthday');

  return generator.getBlob();
};

export const generateRevenuePDF = async (
  data: any[],
  title: string,
  filters: any,
  searchTerm?: string,
  totals?: any
): Promise<Blob> => {
  const generator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  try {
    const api = (await import('../services/api')).default;
    const response = await api.get('/company');

    if (response.data.success && response.data.data) {
      const company = response.data.data;
      companyDetails = {
        name: company.name || 'EasyMauzo Company',
        address: company.address || '123 Business Street, City, Country',
        phone: company.phone || '+1 (555) 123-4567',
        email: company.email || 'info@easymauzo.com',
        website: company.website || 'www.easymauzo.com',
        logo: company.logo || undefined,
        country: company.country || 'Tanzania',
        region: company.region || 'Dar es Salaam'
      };
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // PDF options
  const options: PDFOptions = {
    title: title || 'Revenue Report',
    subtitle: filters.dateFrom && filters.dateTo
      ? `From ${filters.dateFrom} to ${filters.dateTo}`
      : undefined,
    companyDetails,
    logoUrl: companyDetails.logo || '/images/logo.png',
    generatedBy: 'System Administrator',
    generatedOn: new Date().toLocaleString(),
    filters,
    searchTerm,
    reportType: 'current'
  };

  // Prepare table data
  const allHeaders = [
    'Ref Number',
    'Date',
    'Type',
    'Store',
    'Customer',
    'Status',
    'Subtotal',
    'Discount',
    'Tax',
    'Total Amount',
    'Paid',
    'Balance',
    'Currency'
  ];

  const allDataKeys = [
    'transactionRefNumber',
    'transactionDate',
    'transactionType',
    'storeName',
    'customerName',
    'status',
    'subtotal',
    'discountAmount',
    'taxAmount',
    'totalAmount',
    'paidAmount',
    'balanceAmount',
    'currencyName'
  ];

  // Safety check for empty data
  if (!data || data.length === 0) {
    generator.createSimplePDF('Revenue Report', 'No revenue transaction data available for the selected criteria.');
    return generator.getBlob();
  }

  const tableData = data.map(item =>
    allDataKeys.map(key => {
      const value = item[key];
      if (key === 'transactionDate') {
        return value ? new Date(value).toLocaleDateString() : '--';
      } else if (['subtotal', 'discountAmount', 'taxAmount', 'totalAmount', 'paidAmount', 'balanceAmount'].includes(key)) {
        return value ? parseFloat(value).toFixed(2) : '0.00';
      }
      return value || '--';
    })
  );

  // Add totals row if provided
  if (totals) {
    tableData.push([
      'TOTALS',
      '--',
      '--',
      '--',
      '--',
      '--',
      totals.subtotal?.toFixed(2) || '0.00',
      totals.discountAmount?.toFixed(2) || '0.00',
      totals.taxAmount?.toFixed(2) || '0.00',
      totals.totalAmount?.toFixed(2) || '0.00',
      totals.paidAmount?.toFixed(2) || '0.00',
      totals.balanceAmount?.toFixed(2) || '0.00',
      '--'
    ]);
  }

  // Generate table
  await generator.generateTable(allHeaders, tableData, options, 'Sales Transactions');

  return generator.getBlob();
};

export const generateTrialBalancePDF = async (
  data: any[],
  title: string,
  filters: any,
  summary: any,
  metadata: any
): Promise<Blob> => {
  const generator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  try {
    const api = (await import('../services/api')).default;
    const response = await api.get('/company');

    if (response.data.success && response.data.data) {
      const company = response.data.data;
      companyDetails = {
        name: company.name || 'EasyMauzo Company',
        address: company.address || '123 Business Street, City, Country',
        phone: company.phone || '+1 (555) 123-4567',
        email: company.email || 'info@easymauzo.com',
        website: company.website || 'www.easymauzo.com',
        logo: company.logo || undefined,
        country: company.country || 'Tanzania',
        region: company.region || 'Dar es Salaam'
      };
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // PDF options
  const subtitle = metadata?.financialYear
    ? `${metadata.financialYear.name}${filters.startDate && filters.endDate ? ` (${filters.startDate} to ${filters.endDate})` : ''}`
    : undefined;

  const options: PDFOptions = {
    title: title || 'Trial Balance Report',
    subtitle: subtitle,
    companyDetails,
    logoUrl: companyDetails.logo || '/images/logo.png',
    generatedBy: metadata?.generatedBy?.name || 'System Administrator',
    generatedOn: metadata?.generatedAt || new Date().toLocaleString(),
    filters,
    reportType: 'current'
  };

  // Flatten account tree for PDF
  const flattenAccounts = (accounts: any[], level = 0): any[] => {
    let result: any[] = [];
    accounts.forEach(account => {
      result.push({
        level: level,
        code: account.code,
        name: account.name,
        type: account.isAccountType ? 'Account Type' : 'Account',
        debit: account.totalDebit,
        credit: account.totalCredit
      });
      if (account.children && account.children.length > 0) {
        result = result.concat(flattenAccounts(account.children, level + 1));
      }
    });
    return result;
  };

  // Safety check for empty data
  if (!data || data.length === 0) {
    generator.createSimplePDF('Trial Balance Report', 'No account data available for the selected criteria.');
    return generator.getBlob();
  }

  const allFlattened = flattenAccounts(data);

  const allHeaders = [
    'Account Code',
    'Account Name',
    'Debit (Dr)',
    'Credit (Cr)'
  ];

  const tableData = allFlattened.map(item => {
    const indent = '  '.repeat(item.level);
    return [
      `${indent}${item.code || '--'}`,
      item.name || '--',
      item.debit ? parseFloat(item.debit).toFixed(2) : '0.00',
      item.credit ? parseFloat(item.credit).toFixed(2) : '0.00'
    ];
  });

  // Add totals row
  if (summary) {
    tableData.push([
      'TOTALS',
      '--',
      summary.totalDebit?.toFixed(2) || '0.00',
      summary.totalCredit?.toFixed(2) || '0.00'
    ]);

    if (!summary.isBalanced) {
      tableData.push([
        'DIFFERENCE',
        '--',
        summary.difference > 0 ? Math.abs(summary.difference).toFixed(2) : '0.00',
        summary.difference < 0 ? Math.abs(summary.difference).toFixed(2) : '0.00'
      ]);
    }
  }

  // Generate table
  await generator.generateTable(allHeaders, tableData, options, 'Trial Balance');

  return generator.getBlob();
};
