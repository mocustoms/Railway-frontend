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
  public async loadImageAsDataURL(imagePath: string): Promise<string | null> {
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

// Helper function to convert numbers to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Million', 'Billion'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };

  let result = '';
  let scaleIndex = 0;
  let remaining = Math.floor(num);

  if (remaining === 0) {
    // Handle case where only decimals exist
    const decimals = Math.round((num % 1) * 100);
    if (decimals > 0) {
      return ones[decimals] + ' Cents';
    }
    return 'Zero';
  }

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk !== 0) {
      const chunkWords = convertHundreds(chunk);
      const scaleWord = scales[scaleIndex] && scaleIndex > 0 ? ' ' + scales[scaleIndex] : '';
      result = chunkWords + scaleWord + (result ? ' ' + result : '');
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex++;
  }

  // Handle decimals
  const decimals = Math.round((num % 1) * 100);
  if (decimals > 0) {
    result += ' and ' + decimals + '/100';
  }

  return result.trim();
};

// Helper function to generate Sales Invoice PDF
export const generateSalesInvoicePDF = async (
  salesInvoice: any
): Promise<Blob> => {
  // Create new PDF in portrait mode for invoice
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Create a temporary generator instance to use its loadImageAsDataURL method
  const tempGenerator = new ProfessionalPDFGenerator();

  // Fetch company details from API
  let companyDetails: CompanyDetails = {
    name: 'EasyMauzo Company',
    address: '123 Business Street, City, Country',
    phone: '+1 (555) 123-4567',
    email: 'info@easymauzo.com',
    website: 'www.easymauzo.com'
  };

  let systemLogoUrl: string | null = null;
  let companyLogoUrl: string | null = null;
  let currentFinancialYear: string = 'N/A';

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
      // Add TIN and VRN to companyDetails for invoice
      (companyDetails as any).tin = company.tin;
      (companyDetails as any).vrn = company.vrn;
      companyLogoUrl = company.logo || null;
    }

    // Fetch current financial year
    try {
      const financialYearService = (await import('../services/financialYearService')).financialYearService;
      const financialYear = await financialYearService.getCurrentFinancialYear();
      if (financialYear) {
        currentFinancialYear = financialYear.name;
      }
    } catch (error) {
      // Could not fetch financial year, using default
    }
  } catch (error) {
    // Could not fetch company details, using defaults
  }

  // Try to load system logo (could be a government/system logo)
  // Try multiple possible paths
  const systemLogoPaths = [
    '/images/system-logo.png',
    '/images/logo.png',
    '/logo.png',
    '/system-logo.png'
  ];
  
  for (const path of systemLogoPaths) {
    try {
      systemLogoUrl = await tempGenerator.loadImageAsDataURL(path);
      if (systemLogoUrl) break;
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  // Load company logo - use same method as stock balance PDF (from DOM element)
  let companyLogoElement: HTMLImageElement | null = null;
  try {
    companyLogoElement = document.getElementById('company-logo') as HTMLImageElement;
    if (companyLogoElement && companyLogoElement.complete && companyLogoElement.naturalHeight !== 0) {
      // Logo is already loaded, use it directly
      companyLogoUrl = companyLogoElement.src;
    } else if (companyLogoUrl) {
      // Fallback to loading from URL if DOM element not available
      companyLogoUrl = await tempGenerator.loadImageAsDataURL(companyLogoUrl);
    } else {
      companyLogoUrl = null;
    }
  } catch (error) {
    // If DOM method fails, try URL method as fallback
    if (companyLogoUrl) {
      try {
        companyLogoUrl = await tempGenerator.loadImageAsDataURL(companyLogoUrl);
      } catch (fallbackError) {
        companyLogoUrl = null;
      }
    } else {
      companyLogoUrl = null;
    }
  }

  let currentY = margin;

  // ========== HEADER SECTION ==========
  // Company Logo (Top Left) - moved from right to left
  const logoSize = 24; // Increased from 20 to 24 for better visibility
  const leftLogoX = margin;
  const leftLogoRight = leftLogoX + logoSize;
  
  // Try to get company logo from DOM element first (same as stock balance PDF)
  const companyLogoImg = document.getElementById('company-logo') as HTMLImageElement;
  if (companyLogoImg && companyLogoImg.complete && companyLogoImg.naturalHeight !== 0) {
    // Logo is loaded in DOM, use it directly
    doc.addImage(companyLogoImg, 'PNG', leftLogoX, currentY, logoSize, logoSize);
  } else if (companyLogoUrl) {
    // Fallback to URL if DOM element not available
    doc.addImage(companyLogoUrl, 'PNG', leftLogoX, currentY, logoSize, logoSize);
  }

  // Calculate available space for company details (from company logo to right edge)
  const leftBoundary = (companyLogoImg || companyLogoUrl) ? leftLogoRight + 5 : margin;
  const rightBoundary = pageWidth - margin;
  const centerX = pageWidth / 2;
  const maxTextWidth = rightBoundary - leftBoundary;

  // Company Details (Top Center) - Company Name and Address only
  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const companyName = companyDetails.name || 'Company Name';
  const companyNameWidth = doc.getTextWidth(companyName);
  
  // Check if company name fits, if not reduce font size
  let nameFontSize = 14;
  if (companyNameWidth > maxTextWidth) {
    nameFontSize = Math.max(10, (maxTextWidth / companyNameWidth) * 14);
    doc.setFontSize(nameFontSize);
  }
  
  doc.text(companyName, centerX, currentY + 5, { align: 'center', maxWidth: maxTextWidth });

  // Address - handle dynamic formats (comma-separated, newline-separated, or single line)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  let addressY = currentY + 10;
  
  // Process address - handle different formats dynamically
  let addressLines: string[] = [];
  
  if (companyDetails.address) {
    // Check if address contains newlines
    if (companyDetails.address.includes('\n')) {
      // Split by newlines
      addressLines = companyDetails.address.split('\n').map(s => s.trim()).filter(s => s);
    } else if (companyDetails.address.includes(',')) {
      // Split by commas
      addressLines = companyDetails.address.split(',').map(s => s.trim()).filter(s => s);
    } else {
      // Single line address
      addressLines = [companyDetails.address.trim()].filter(s => s);
    }
  }
  
  // Display address lines with proper wrapping
  let lineOffset = 0;
  addressLines.forEach((line, index) => {
    if (line) {
      const lineWidth = doc.getTextWidth(line);
      if (lineWidth > maxTextWidth) {
        // Wrap long lines by splitting into words
        const words = line.split(' ');
        let currentLine = '';
        let wordOffset = 0;
        
        words.forEach((word: string) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth > maxTextWidth && currentLine) {
            // Current line is full, print it and start new line
            doc.text(currentLine, centerX, addressY + (lineOffset * 4), { align: 'center', maxWidth: maxTextWidth });
            currentLine = word;
            lineOffset++;
            wordOffset++;
          } else {
            currentLine = testLine;
          }
        });
        
        // Print remaining line
        if (currentLine) {
          doc.text(currentLine, centerX, addressY + (lineOffset * 4), { align: 'center', maxWidth: maxTextWidth });
          lineOffset++;
        }
      } else {
        // Line fits, print directly
        doc.text(line, centerX, addressY + (lineOffset * 4), { align: 'center', maxWidth: maxTextWidth });
        lineOffset++;
      }
    }
  });

  // Calculate final Y position based on actual lines displayed
  const finalAddressY = addressY + (lineOffset > 0 ? (lineOffset - 1) * 4 : 0);

  // TAX INVOICE Title
  currentY = finalAddressY + 10;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TAX INVOICE', centerX, currentY, { align: 'center' });

  currentY += 15;

  // ========== CUSTOMER AND ORGANIZATION INFO SECTION ==========
  const infoSectionY = currentY;
  
  // Calculate column positions - Company Details far left, Customer Info aligned with table right edge
  const leftColumnX = margin;
  const centerGap = 50; // Gap between columns to prevent overlap
  const maxLeftColumnWidth = 75; // Fixed width for left column (Company Details)
  
  // Calculate table width (will be used to align Customer Details)
  // Note: availableWidth is declared later in the table section, so we calculate it here with a different name
  const tableAvailableWidth = pageWidth - (margin * 2);
  
  // Customer Details positioned to align with right edge of product table
  const customerDetailsWidth = 85; // Width for customer details column
  // Position to align with table right edge: margin + tableAvailableWidth - customerDetailsWidth
  // This will align the right edge of Customer Details with the right edge of the table
  const customerDetailsLeftEdge = margin + tableAvailableWidth - customerDetailsWidth;
  
  // Ensure minimum column widths
  const minColumnWidth = 60; // Minimum width to prevent too narrow columns
  const actualLeftWidth = Math.max(minColumnWidth, maxLeftColumnWidth);
  const actualRightWidth = customerDetailsWidth; // Use fixed width for right column

  // Company Details (Far Left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('COMPANY DETAILS', leftColumnX, infoSectionY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  let orgY = infoSectionY + 6;

  // Get TIN and VRN from company details
  const tin = (companyDetails as any).tin || 'N/A';
  const vrn = (companyDetails as any).vrn || 'N/A';
  
  doc.text(`TIN: ${tin}`, leftColumnX, orgY, { maxWidth: actualLeftWidth });
  orgY += 5;
  doc.text(`VRN: ${vrn}`, leftColumnX, orgY, { maxWidth: actualLeftWidth });
  orgY += 5;
  
  // Store name with wrapping
  if (salesInvoice.storeName) {
    const storeText = `Store: ${salesInvoice.storeName}`;
    const storeWidth = doc.getTextWidth(storeText);
    if (storeWidth > actualLeftWidth) {
      doc.text('Store:', leftColumnX, orgY, { maxWidth: actualLeftWidth });
      orgY += 4;
      // Wrap store name if needed
      const storeWords = salesInvoice.storeName.split(' ');
      let storeLine = '';
      storeWords.forEach((word: string) => {
        const testLine = storeLine ? `${storeLine} ${word}` : word;
        if (doc.getTextWidth(testLine) > actualLeftWidth && storeLine) {
          doc.text(storeLine, leftColumnX, orgY, { maxWidth: actualLeftWidth });
          orgY += 4;
          storeLine = word;
        } else {
          storeLine = testLine;
        }
      });
      if (storeLine) {
        doc.text(storeLine, leftColumnX, orgY, { maxWidth: actualLeftWidth });
        orgY += 5;
      }
    } else {
      doc.text(storeText, leftColumnX, orgY, { maxWidth: actualLeftWidth });
      orgY += 5;
    }
  }

  // Customer Information (Far Right) - Left-aligned within right column
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CUSTOMER DETAILS', customerDetailsLeftEdge, infoSectionY, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  let customerY = infoSectionY + 6;
  
  // Customer Name - with proper text wrapping (label and value on same line)
  const customerName = salesInvoice.customerName || 'N/A';
  const nameText = `Name: ${customerName}`;
  const nameLines = doc.splitTextToSize(nameText, actualRightWidth);
  nameLines.forEach((line: string) => {
    doc.text(line, customerDetailsLeftEdge, customerY, { align: 'left' });
    customerY += 4;
  });
  customerY += 1; // Extra spacing after name
  
  // Customer Address - with proper text wrapping (label and value on same line, handles all dynamic cases)
  const customerAddress = salesInvoice.customerAddress || 'Not provided';
  const addressText = `Address: ${customerAddress}`;
  
  // Use splitTextToSize to handle all cases: single line, multi-line (with \n), long addresses, etc.
  // This will automatically wrap text and handle newlines properly
  const customerAddressLines = doc.splitTextToSize(addressText, actualRightWidth);
  customerAddressLines.forEach((line: string) => {
    doc.text(line, customerDetailsLeftEdge, customerY, { align: 'left' });
    customerY += 4;
  });
  customerY += 1; // Extra spacing after address
  
  // Phone - with proper text wrapping (label and value on same line)
  if (salesInvoice.customerPhone) {
    const phoneText = `Phone: ${salesInvoice.customerPhone}`;
    const phoneLines = doc.splitTextToSize(phoneText, actualRightWidth);
    phoneLines.forEach((line: string) => {
      doc.text(line, customerDetailsLeftEdge, customerY, { align: 'left' });
      customerY += 4;
    });
    customerY += 1; // Extra spacing after phone
  }
  
  // Email - with proper text wrapping (label and value on same line)
  if (salesInvoice.customerEmail) {
    const emailText = `Email: ${salesInvoice.customerEmail}`;
    const emailLines = doc.splitTextToSize(emailText, actualRightWidth);
    emailLines.forEach((line: string) => {
      doc.text(line, customerDetailsLeftEdge, customerY, { align: 'left' });
      customerY += 4;
    });
    customerY += 1; // Extra spacing after email
  }

  // Ensure proper spacing - use the maximum Y position and add extra space to prevent overlap
  currentY = Math.max(customerY, orgY) + 15;

  // ========== INVOICE DETAILS ==========
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE DETAILS', leftColumnX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  currentY += 6;
  
  // Invoice Number with wrapping
  const invoiceNo = salesInvoice.invoiceRefNumber || 'N/A';
  const invoiceNoText = `Invoice No: ${invoiceNo}`;
  const invoiceNoWidth = doc.getTextWidth(invoiceNoText);
  if (invoiceNoWidth > maxLeftColumnWidth) {
    doc.text('Invoice No:', leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 4;
    doc.text(invoiceNo, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  } else {
    doc.text(invoiceNoText, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  }
  
  // Invoice Date
  const invoiceDate = salesInvoice.invoiceDate ? new Date(salesInvoice.invoiceDate).toLocaleDateString('en-GB') : 'N/A';
  doc.text(`Invoice Date: ${invoiceDate}`, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
  currentY += 5;
  
  if (salesInvoice.dueDate) {
    const dueDate = new Date(salesInvoice.dueDate).toLocaleDateString('en-GB');
    doc.text(`Due Date: ${dueDate}`, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  }
  
  // Currency
  const currencyText = `Currency: ${salesInvoice.currencyName || salesInvoice.currencySymbol || 'USD'}`;
  const currencyWidth = doc.getTextWidth(currencyText);
  if (currencyWidth > maxLeftColumnWidth) {
    doc.text('Currency:', leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 4;
    doc.text(salesInvoice.currencyName || salesInvoice.currencySymbol || 'USD', leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  } else {
    doc.text(currencyText, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  }
  
  // Exchange Rate
  if (salesInvoice.exchangeRateValue) {
    const exchangeRateText = `Exchange Rate: ${salesInvoice.exchangeRateValue.toFixed(6)}`;
    const exchangeRateWidth = doc.getTextWidth(exchangeRateText);
    if (exchangeRateWidth > maxLeftColumnWidth) {
      doc.text('Exchange Rate:', leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
      currentY += 4;
      doc.text(salesInvoice.exchangeRateValue.toFixed(6), leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
      currentY += 5;
    } else {
      doc.text(exchangeRateText, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
      currentY += 5;
    }
  }
  
  // Payment Status
  if (salesInvoice.paidAmount !== undefined && salesInvoice.paidAmount !== null && salesInvoice.paidAmount > 0) {
    doc.text(`Paid Amount: ${(salesInvoice.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  }
  
  if (salesInvoice.balanceAmount !== undefined && salesInvoice.balanceAmount !== null) {
    doc.text(`Invoice Amount: ${(salesInvoice.balanceAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, leftColumnX, currentY, { maxWidth: maxLeftColumnWidth });
    currentY += 5;
  }

  currentY += 5;

  // ========== ITEMS TABLE ==========
  const tableStartY = currentY;
  
  // Check if items have discounts or notes
  const hasItemDiscounts = salesInvoice.items && salesInvoice.items.some((item: any) => 
    (item.discountPercentage !== undefined && item.discountPercentage > 0) ||
    (item.discountAmount !== undefined && item.discountAmount > 0)
  );
  const hasItemNotes = salesInvoice.items && salesInvoice.items.some((item: any) => item.notes);
  
  // Calculate available width for table
  const availableWidth = pageWidth - (margin * 2);
  
  // Define column configuration matching the view design (no SN column)
  interface ColumnConfig {
    header: string;
    key: string;
    minWidth: number; // Minimum width in mm
    preferredPercent: number; // Preferred percentage of available width
    align: 'left' | 'right' | 'center';
  }
  
  const columnConfigs: ColumnConfig[] = [
    { header: 'No', key: 'no', minWidth: 10, preferredPercent: 3, align: 'center' },
    { header: 'Product', key: 'product', minWidth: 45, preferredPercent: 30, align: 'left' },
    { header: 'Qty', key: 'quantity', minWidth: 18, preferredPercent: 8, align: 'right' },
    { header: 'Unit Price', key: 'unitPrice', minWidth: 22, preferredPercent: 10, align: 'right' }
  ];
  
  if (hasItemDiscounts) {
    columnConfigs.push({ header: 'Discount', key: 'discount', minWidth: 18, preferredPercent: 8, align: 'right' });
  }
  
  columnConfigs.push(
    { header: 'Subtotal', key: 'subtotal', minWidth: 22, preferredPercent: 10, align: 'right' },
    { header: 'Tax', key: 'tax', minWidth: 20, preferredPercent: 9, align: 'right' },
    { header: 'Total', key: 'lineTotal', minWidth: 22, preferredPercent: 12, align: 'right' }
  );
  
  if (hasItemNotes) {
    columnConfigs.push({ header: 'Notes', key: 'notes', minWidth: 25, preferredPercent: 10, align: 'left' });
  }
  
  // Calculate actual column widths dynamically
  const colWidths: number[] = [];
  const tableHeaders: string[] = [];
  
  // First pass: calculate preferred widths
  let totalPreferredWidth = 0;
  columnConfigs.forEach(config => {
    tableHeaders.push(config.header);
    const preferredWidth = (availableWidth * config.preferredPercent) / 100;
    colWidths.push(Math.max(config.minWidth, preferredWidth));
    totalPreferredWidth += colWidths[colWidths.length - 1];
  });
  
  // Adjust if total exceeds available width
  if (totalPreferredWidth > availableWidth) {
    const scale = availableWidth / totalPreferredWidth;
    colWidths.forEach((width, index) => {
      colWidths[index] = Math.max(columnConfigs[index].minWidth, width * scale);
    });
  } else if (totalPreferredWidth < availableWidth) {
    // Distribute extra space proportionally to flexible columns (Product and Notes)
    const extraSpace = availableWidth - totalPreferredWidth;
    const flexibleColumns = columnConfigs
      .map((config, index) => ({ config, index }))
      .filter(({ config }) => config.key === 'product' || config.key === 'notes');
    
    if (flexibleColumns.length > 0) {
      const spacePerColumn = extraSpace / flexibleColumns.length;
      flexibleColumns.forEach(({ index }) => {
        colWidths[index] += spacePerColumn;
      });
    } else {
      // If no flexible columns, distribute to Product column (usually the largest)
      const productIndex = columnConfigs.findIndex(c => c.key === 'product');
      if (productIndex >= 0) {
        colWidths[productIndex] += extraSpace;
      }
    }
  }
  
  // Final adjustment to ensure total equals available width
  const finalTotal = colWidths.reduce((sum, w) => sum + w, 0);
  if (Math.abs(finalTotal - availableWidth) > 0.1) {
    const adjustment = availableWidth - finalTotal;
    // Adjust the Product column (usually the largest flexible column)
    const productIndex = columnConfigs.findIndex(c => c.key === 'product');
    if (productIndex >= 0) {
      colWidths[productIndex] += adjustment;
    } else {
      // If no product column, distribute proportionally to all columns
      const adjustmentPerColumn = adjustment / colWidths.length;
      colWidths.forEach((width, index) => {
        colWidths[index] = width + adjustmentPerColumn;
      });
    }
  }
  
  // Use the actual sum of column widths as table width (not availableWidth) to prevent extra space
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Draw table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableStartY, tableWidth, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  let headerX = margin;
  tableHeaders.forEach((header, index) => {
    doc.text(header, headerX + 2, tableStartY + 5);
    headerX += colWidths[index];
  });

  // Draw header borders (top and bottom)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  // Top border
  doc.line(margin, tableStartY, margin + tableWidth, tableStartY);
  // Bottom border
  doc.line(margin, tableStartY + 8, margin + tableWidth, tableStartY + 8);

  // Table rows
  let rowY = tableStartY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  if (salesInvoice.items && salesInvoice.items.length > 0) {
    salesInvoice.items.forEach((item: any, index: number) => {
      const product = item.productName || item.product?.name || 'N/A';
      
      // Format quantity - show decimals only if they exist (matching view formatQuantity)
      let quantity: string;
      if (typeof item.quantity !== 'number') {
        quantity = '0';
      } else if (item.quantity % 1 === 0) {
        quantity = item.quantity.toString();
      } else {
        quantity = (item.quantity || 0).toFixed(3).replace(/\.?0+$/, '');
      }
      
      // Format unit price (matching view formatNumber)
      const unitPrice = (item.unitPrice || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      
      // Format discount (matching view renderDiscount)
      let discount = '-';
      if (hasItemDiscounts) {
        if (item.discountPercentage !== undefined && item.discountPercentage > 0) {
          discount = `${item.discountPercentage.toFixed(2)}%`;
        } else if (item.discountAmount !== undefined && item.discountAmount > 0) {
          discount = (item.discountAmount || 0).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
        }
      }
      
      // Calculate subtotal (quantity * unitPrice)
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const subtotalFormatted = subtotal.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      
      // Format tax amount (use taxAmount if available, otherwise calculate from taxPercentage)
      let taxAmount = 0;
      if (item.taxAmount !== undefined && item.taxAmount !== null) {
        taxAmount = item.taxAmount;
      } else if (item.taxPercentage) {
        // Calculate tax: apply tax to amount after discount
        const lineSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
        let lineDiscount = 0;
        if (item.discountAmount !== undefined && item.discountAmount > 0) {
          lineDiscount = item.discountAmount;
        } else if (item.discountPercentage) {
          lineDiscount = lineSubtotal * (item.discountPercentage / 100);
        }
        const amountAfterDiscount = lineSubtotal - lineDiscount;
        taxAmount = amountAfterDiscount * (item.taxPercentage / 100);
      }
      const taxAmountFormatted = taxAmount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      
      // Format line total (matching view formatNumber)
      const lineTotal = (item.lineTotal || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
      
      const notes = item.notes || '-';
      const itemNumber = (index + 1).toString(); // Product number (1, 2, 3, etc.)

      // Draw row border (top)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, rowY, margin + tableWidth, rowY);

      // Fixed row height - no dynamic wrapping to avoid empty rows
      const rowHeight = 8;
      let cellX = margin;
      
      // Build cell data array dynamically matching column order
      const cellData: string[] = [itemNumber, product, quantity, unitPrice];
      if (hasItemDiscounts) {
        cellData.push(discount);
      }
      cellData.push(subtotalFormatted, taxAmountFormatted, lineTotal);
      if (hasItemNotes) {
        cellData.push(notes);
      }
      
      // Render each cell
      cellData.forEach((cell, colIndex) => {
        const config = columnConfigs[colIndex];
        const cellWidth = colWidths[colIndex];
        const padding = 3;
        const cellY = rowY + (rowHeight / 2) - 1; // Center vertically in row
        
        // Truncate text if too long instead of wrapping to avoid row height issues
        const maxCellWidth = cellWidth - (padding * 2);
        let displayText = cell;
        const textWidth = doc.getTextWidth(cell);
        
        // Product name is at index 1 (after No column)
        if (textWidth > maxCellWidth && config.key === 'product') {
          // For product name, truncate with ellipsis
          let truncated = cell;
          while (doc.getTextWidth(truncated + '...') > maxCellWidth && truncated.length > 0) {
            truncated = truncated.substring(0, truncated.length - 1);
          }
          displayText = truncated.length < cell.length ? truncated + '...' : truncated;
        } else if (textWidth > maxCellWidth) {
          // For other columns, just truncate
          let truncated = cell;
          while (doc.getTextWidth(truncated) > maxCellWidth && truncated.length > 0) {
            truncated = truncated.substring(0, truncated.length - 1);
          }
          displayText = truncated;
        }
        
        // Render cell text
        let alignX: number;
        if (config.align === 'right') {
          alignX = cellX + cellWidth - padding;
        } else if (config.align === 'center') {
          alignX = cellX + (cellWidth / 2);
        } else {
          alignX = cellX + padding;
        }
        doc.text(displayText, alignX, cellY, { 
          align: config.align,
          maxWidth: maxCellWidth 
        });
        
        cellX += colWidths[colIndex];
      });
      
      // Move to next row
      rowY += rowHeight;
    });
  } else {
    // No items - show message (matching view)
    // Column count: No(1) + Product(1) + Qty(1) + Unit Price(1) + [Discount(1) if has] + Subtotal(1) + Tax(1) + Total(1) + [Notes(1) if has]
    const noItemsColSpan = hasItemDiscounts 
      ? (hasItemNotes ? 9 : 8)  // With discount: 1+1+1+1+1+1+1+1+1 = 9 (with notes) or 8 (without notes)
      : (hasItemNotes ? 8 : 7);  // Without discount: 1+1+1+1+1+1+1+1 = 8 (with notes) or 7 (without notes)
    const noItemsWidth = colWidths.reduce((sum, w) => sum + w, 0);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('No items found for this invoice.', margin + (noItemsWidth / 2), rowY + 4, { align: 'center' });
    rowY += 8;
  }

  // Draw bottom border of table
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, rowY, margin + tableWidth, rowY);
  
  // Draw all vertical lines for the entire table
  let verticalX = margin;
  colWidths.forEach((width, index) => {
    verticalX += width;
    // Draw vertical line for each column (right border of current column)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(verticalX, tableStartY, verticalX, rowY);
  });
  
  // Draw left border of Notes column explicitly (make it more visible)
  if (hasItemNotes) {
    // Find the Notes column index
    const notesColumnIndex = columnConfigs.findIndex(c => c.key === 'notes');
    if (notesColumnIndex >= 0 && notesColumnIndex > 0) {
      // Calculate the left edge of Notes column (right edge of previous column)
      let notesLeftEdge = margin;
      for (let i = 0; i < notesColumnIndex; i++) {
        notesLeftEdge += colWidths[i];
      }
      // Draw left border for Notes column with slightly thicker line for visibility
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(notesLeftEdge, tableStartY, notesLeftEdge, rowY);
    }
  }
  
  // Draw left border of table (first column)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, tableStartY, margin, rowY);

  currentY = rowY + 8;

  // ========== TOTALS SECTION ==========
  // Position totals on the right side, aligned with the Line Total column
  // Calculate safe positioning to avoid overlap with Customer Details
  const totalsWidth = 80; // Total width for totals section
  const labelWidth = 50; // Width for labels
  const numberRightEdge = margin + tableWidth - 2; // Numbers at right edge of table
  const labelRightEdge = numberRightEdge - 30; // Labels positioned before numbers
  
  // Ensure totals section starts after Customer Details (which ends around pageWidth/2)
  // Position totals to align with table's right edge
  const safeTotalsX = Math.max(margin + tableWidth - totalsWidth, pageWidth / 2 + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const subtotal = salesInvoice.subtotal || 0;
  const discount = salesInvoice.discountAmount || 0;
  const tax = salesInvoice.taxAmount || 0;
  const totalAmount = salesInvoice.totalAmount || 0;

  let totalY = currentY;
  
  // Subtotal (matching view)
  const subtotalLabel = 'Subtotal:';
  const subtotalValue = subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const maxLabelWidth = labelWidth;
  const maxValueWidth = 30;
  
  doc.text(subtotalLabel, labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
  doc.text(subtotalValue, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
  totalY += 5;

  // Total Discount (matching view) - always show if discount exists
  if (discount > 0) {
    const discountLabel = 'Total Discount:';
    const discountValue = discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const discountLabelWidth = doc.getTextWidth(discountLabel);
    
    if (discountLabelWidth > maxLabelWidth) {
      // Wrap label if too long
      doc.text('Total', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
      totalY += 4;
      doc.text('Discount:', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    } else {
      doc.text(discountLabel, labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    }
    doc.text(`-${discountValue}`, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
    totalY += 5;
  }

  // Total Tax (matching view) - always show if tax exists
  if (tax > 0) {
    const taxLabel = 'Total Tax:';
    const taxValue = tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    doc.text(taxLabel, labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    doc.text(taxValue, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
    totalY += 5;
  }

  // Draw separator line before Total Amount (matching view)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(labelRightEdge - maxLabelWidth, totalY, numberRightEdge, totalY);
  totalY += 3;

  // Total Amount (bold, matching view)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const totalLabel = 'Total Amount:';
  const totalValue = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalLabelWidth = doc.getTextWidth(totalLabel);
  
  if (totalLabelWidth > maxLabelWidth) {
    // Wrap label if too long
    doc.text('Total', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    totalY += 4;
    doc.text('Amount:', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
  } else {
    doc.text(totalLabel, labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
  }
  doc.text(totalValue, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
  totalY += 5;
  
  // Equivalent Amount (if available, matching view)
  if (salesInvoice.equivalentAmount) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const equivLabel = 'Equivalent Amount:';
    const equivLabelWidth = doc.getTextWidth(equivLabel);
    
    if (equivLabelWidth > maxLabelWidth) {
      // Wrap label if too long
      doc.text('Equivalent', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
      totalY += 4;
      doc.text('Amount:', labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    } else {
      doc.text(equivLabel, labelRightEdge, totalY, { align: 'right', maxWidth: maxLabelWidth });
    }
    
    // Try to get system default currency symbol
    let equivalentCurrency = '';
    if (salesInvoice.systemDefaultCurrency) {
      equivalentCurrency = (salesInvoice.systemDefaultCurrency as any).symbol || 
                           (salesInvoice.systemDefaultCurrency as any).code || '';
    }
    const equivValue = `${equivalentCurrency ? equivalentCurrency + ' ' : ''}${salesInvoice.equivalentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const equivValueWidth = doc.getTextWidth(equivValue);
    if (equivValueWidth > maxValueWidth) {
      // Truncate value if too long
      let truncated = equivValue;
      while (doc.getTextWidth(truncated) > maxValueWidth && truncated.length > 0) {
        truncated = truncated.substring(0, truncated.length - 1);
      }
      doc.text(truncated, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
    } else {
      doc.text(equivValue, numberRightEdge, totalY, { align: 'right', maxWidth: maxValueWidth });
    }
    totalY += 5;
  }

  currentY = totalY + 10;

  // ========== INVOICE DESCRIPTION AND TOTAL IN WORDS ==========
  if (salesInvoice.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice description', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    currentY += 5;
    
    // Wrap invoice description text to fit page width
    const descriptionWidth = pageWidth - (margin * 2);
    const descriptionLines = doc.splitTextToSize(salesInvoice.notes, descriptionWidth);
    descriptionLines.forEach((line: string) => {
      doc.text(line, margin, currentY, { maxWidth: descriptionWidth });
      currentY += 4;
    });
    currentY += 4; // Extra spacing after description
  }

  // Total in words
  // Format currency name properly (e.g., "USD" -> "US Dollars", "TZS" -> "Tanzanian Shillings")
  let currencyName = salesInvoice.currencyName || 'US Dollars';
  if (salesInvoice.currencySymbol && !salesInvoice.currencyName) {
    // If we only have symbol, try to infer name
    const currencyMap: { [key: string]: string } = {
      '$': 'US Dollars',
      'USD': 'US Dollars',
      'TZS': 'Tanzanian Shillings',
      'TSH': 'Tanzanian Shillings',
      'EUR': 'Euros',
      'GBP': 'British Pounds',
      'KES': 'Kenyan Shillings'
    };
    currencyName = currencyMap[salesInvoice.currencySymbol] || currencyMap[salesInvoice.currencySymbol.toUpperCase()] || 'US Dollars';
  }
  // Use totalAmount for words conversion (matching view - Total Amount is the final amount)
  const totalInWords = numberToWords(totalAmount);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const wordsText = `${totalInWords.charAt(0).toUpperCase() + totalInWords.slice(1)} ${currencyName} Only`;
  
  // Wrap amount in words text to fit page width
  const wordsWidth = pageWidth - (margin * 2);
  const wordsLines = doc.splitTextToSize(wordsText, wordsWidth);
  wordsLines.forEach((line: string) => {
    doc.text(line, centerX, currentY, { align: 'center', maxWidth: wordsWidth });
    currentY += 4;
  });
  currentY += 6; // Extra spacing after words

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // ========== NOTES ==========
  if (salesInvoice.termsConditions) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    currentY += 5;
    
    // Wrap notes text to fit page width
    const notesWidth = pageWidth - (margin * 2);
    const notesTextLines = salesInvoice.termsConditions.split('\n');
    notesTextLines.forEach((line: string) => {
      if (line.trim()) {
        // Wrap each line if it's too long
        const wrappedLines = doc.splitTextToSize(line.trim(), notesWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          doc.text(wrappedLine, margin, currentY, { maxWidth: notesWidth });
          currentY += 4;
        });
      }
    });
    currentY += 5;
  }

  // ========== SIGNATURE SECTION ==========
  // Dynamically position signature section based on content above
  // Ensure minimum space from bottom, but adjust if content is long
  const minSignatureY = pageHeight - 50; // Minimum 50mm from bottom
  const signatureY = Math.max(currentY + 10, minSignatureY);
  const signatureColWidth = (pageWidth - (margin * 2) - 20) / 2;
  const signatureRightX = pageWidth / 2 + 10;
  const issuingDate = salesInvoice.createdAt ? new Date(salesInvoice.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  
  // Check if we need a new page (if signature section would be too close to bottom or off page)
  if (signatureY + 30 > pageHeight - margin) {
    // Add new page and draw signatures there
    doc.addPage();
    const newSignatureY = margin + 20;
    
    // Draw Issuing Officer on new page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Issuing Officer:', margin, newSignatureY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    let newSigY = newSignatureY + 8;
    doc.text('Name: ___________________', margin, newSigY);
    newSigY += 6;
    doc.text('Signature: ___________________', margin, newSigY);
    newSigY += 6;
    doc.text(`Date: ${issuingDate}`, margin, newSigY);
    
    // Draw Authorizing Officer on new page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Authorizing Officer:', signatureRightX, newSignatureY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    newSigY = newSignatureY + 8;
    doc.text('Name: ___________________', signatureRightX, newSigY);
    newSigY += 6;
    doc.text('Signature: ___________________', signatureRightX, newSigY);
    newSigY += 6;
    doc.text(`Date: ${issuingDate}`, signatureRightX, newSigY);
  } else {
    // Draw signatures on current page
    // Issuing Officer (Left)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Issuing Officer:', margin, signatureY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    let sigY = signatureY + 8;
    doc.text('Name: ___________________', margin, sigY);
    sigY += 6;
    doc.text('Signature: ___________________', margin, sigY);
    sigY += 6;
    doc.text(`Date: ${issuingDate}`, margin, sigY);

    // Authorizing Officer (Right)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Authorizing Officer:', signatureRightX, signatureY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    sigY = signatureY + 8;
    doc.text('Name: ___________________', signatureRightX, sigY);
    sigY += 6;
    doc.text('Signature: ___________________', signatureRightX, sigY);
    sigY += 6;
    doc.text(`Date: ${issuingDate}`, signatureRightX, sigY);
  }

  // ========== FOOTER: Powered by TenZen ==========
  // Add "Powered by TenZen" with logo at bottom right of last page
  const footerY = pageHeight - 15; // 15mm from bottom
  const footerRightX = pageWidth - margin;
  
  // Try to load TenZen logo
  const tenzenLogoPaths = [
    '/images/tenzen-logo.png',
    '/images/logo.png',
    '/logo.png',
    '/tenzen-logo.png'
  ];
  
  let tenzenLogoUrl: string | null = null;
  for (const path of tenzenLogoPaths) {
    try {
      tenzenLogoUrl = await tempGenerator.loadImageAsDataURL(path);
      if (tenzenLogoUrl) break;
    } catch (error) {
      continue;
    }
  }
  
  // Also try to get from DOM if available
  const tenzenLogoImg = document.getElementById('tenzen-logo') as HTMLImageElement;
  if (!tenzenLogoUrl && tenzenLogoImg && tenzenLogoImg.complete && tenzenLogoImg.naturalHeight !== 0) {
    // Use DOM element directly
    const footerLogoSize = 12;
    const footerLogoX = footerRightX - footerLogoSize - 2;
    const footerTextX = footerLogoX - 5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const poweredByText = 'Powered by TenZen';
    const textWidth = doc.getTextWidth(poweredByText);
    
    // Draw text first, then logo
    doc.text(poweredByText, footerTextX - textWidth, footerY, { align: 'right' });
    doc.addImage(tenzenLogoImg, 'PNG', footerLogoX, footerY - footerLogoSize / 2, footerLogoSize, footerLogoSize);
  } else if (tenzenLogoUrl) {
    // Use loaded URL
    const footerLogoSize = 12;
    const footerLogoX = footerRightX - footerLogoSize - 2;
    const footerTextX = footerLogoX - 5;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const poweredByText = 'Powered by TenZen';
    const textWidth = doc.getTextWidth(poweredByText);
    
    // Draw text first, then logo
    doc.text(poweredByText, footerTextX - textWidth, footerY, { align: 'right' });
    doc.addImage(tenzenLogoUrl, 'PNG', footerLogoX, footerY - footerLogoSize / 2, footerLogoSize, footerLogoSize);
  } else {
    // No logo available, just show text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Powered by TenZen', footerRightX, footerY, { align: 'right' });
  }

  return doc.output('blob');
};
