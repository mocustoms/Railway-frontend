import * as XLSX from 'xlsx';

export interface ExcelExportData {
  data: any[];
  headers: string[];
  title: string;
  reportType: 'current' | 'historical';
  asOfDate?: string;
  filters?: any;
  searchTerm?: string;
}

export interface ChartExcelData {
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  title: string;
  reportType: 'current' | 'historical';
  asOfDate?: string;
}

// Export table data to Excel
export const exportTableToExcel = (exportData: ExcelExportData) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare the data for Excel
    const excelData = exportData.data.map(item => {
      const row: any = {};
      exportData.headers.forEach((header, index) => {
        const key = Object.keys(item)[index];
        row[header] = item[key] || '--';
      });
      return row;
    });

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = exportData.headers.map(header => ({
      wch: Math.max(header.length, 15) // Minimum width of 15
    }));
    worksheet['!cols'] = colWidths;

    // Add title and metadata
    const titleRow = [
      `${exportData.title} - ${exportData.reportType === 'current' ? 'Current Stock Balance Report' : `Stock Balance as of Date Report (${exportData.asOfDate ? new Date(exportData.asOfDate).toLocaleDateString() : 'Date'})`}`
    ];
    const dateRow = [`Generated on: ${new Date().toLocaleDateString()}`];
    const filterRow = exportData.filters ? [`Filters: ${JSON.stringify(exportData.filters)}`] : [];
    const searchRow = exportData.searchTerm ? [`Search: ${exportData.searchTerm}`] : [];
    const emptyRow = [''];
    const headerRow = exportData.headers;

    // Insert metadata rows at the beginning
    XLSX.utils.sheet_add_aoa(worksheet, [titleRow], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [dateRow], { origin: 'A2' });
    if (filterRow.length > 0) {
      XLSX.utils.sheet_add_aoa(worksheet, [filterRow], { origin: 'A3' });
    }
    if (searchRow.length > 0) {
      XLSX.utils.sheet_add_aoa(worksheet, [searchRow], { origin: 'A4' });
    }
    XLSX.utils.sheet_add_aoa(worksheet, [emptyRow], { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(worksheet, [headerRow], { origin: 'A6' });

    // Style the title row
    if (!worksheet['A1']) worksheet['A1'] = { v: '', t: 's' };
    worksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };

    // Style the header row
    exportData.headers.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 5, c: index });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '', t: 's' };
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6F3FF' } },
        alignment: { horizontal: 'center' }
      };
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Balance Data');

    // Generate filename
    const filename = `${exportData.title.replace(/\s+/g, '-').toLowerCase()}-${exportData.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    // Error exporting to Excel
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export chart data to Excel
export const exportChartToExcel = (chartData: ChartExcelData) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare chart data
    const chartSheetData = [
      ['Category', 'Quantity', 'Percentage', 'Color'],
      ...chartData.chartData.labels.map((label, index) => {
        const value = chartData.chartData.datasets[0].data[index];
        const total = chartData.chartData.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        const color = chartData.chartData.datasets[0].backgroundColor[index];
        return [label, value, `${percentage}%`, color];
      })
    ];

    // Create worksheet from chart data
    const chartWorksheet = XLSX.utils.aoa_to_sheet(chartSheetData);

    // Set column widths
    chartWorksheet['!cols'] = [
      { wch: 20 }, // Category
      { wch: 15 }, // Quantity
      { wch: 15 }, // Percentage
      { wch: 10 }  // Color
    ];

    // Style the header row
    ['A1', 'B1', 'C1', 'D1'].forEach(cellRef => {
      if (!chartWorksheet[cellRef]) chartWorksheet[cellRef] = { v: '', t: 's' };
      chartWorksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6F3FF' } },
        alignment: { horizontal: 'center' }
      };
    });

    // Add title and metadata
    const titleRow = [
      `${chartData.title} - ${chartData.reportType === 'current' ? 'Current Stock Balance Report' : `Stock Balance as of Date Report (${chartData.asOfDate ? new Date(chartData.asOfDate).toLocaleDateString() : 'Date'})`}`
    ];
    const dateRow = [`Generated on: ${new Date().toLocaleDateString()}`];
    const emptyRow = [''];

    // Insert metadata rows at the beginning
    XLSX.utils.sheet_add_aoa(chartWorksheet, [titleRow], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(chartWorksheet, [dateRow], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(chartWorksheet, [emptyRow], { origin: 'A3' });

    // Style the title row
    if (!chartWorksheet['A1']) chartWorksheet['A1'] = { v: '', t: 's' };
    chartWorksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, chartWorksheet, 'Chart Data');

    // Generate filename
    const filename = `${chartData.title.replace(/\s+/g, '-').toLowerCase()}-chart-${chartData.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    // Error exporting chart to Excel
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export both table and chart data to Excel with multiple sheets
export const exportCompleteReportToExcel = (tableData: ExcelExportData, chartData: ChartExcelData) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // === TABLE DATA SHEET ===
    const excelData = tableData.data.map(item => {
      const row: any = {};
      tableData.headers.forEach((header, index) => {
        const key = Object.keys(item)[index];
        row[header] = item[key] || '--';
      });
      return row;
    });

    const tableWorksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for table
    const colWidths = tableData.headers.map(header => ({
      wch: Math.max(header.length, 15)
    }));
    tableWorksheet['!cols'] = colWidths;

    // Add title and metadata for table
    const titleRow = [
      `${tableData.title} - ${tableData.reportType === 'current' ? 'Current Stock Balance Report' : `Stock Balance as of Date Report (${tableData.asOfDate ? new Date(tableData.asOfDate).toLocaleDateString() : 'Date'})`}`
    ];
    const dateRow = [`Generated on: ${new Date().toLocaleDateString()}`];
    const filterRow = tableData.filters ? [`Filters: ${JSON.stringify(tableData.filters)}`] : [];
    const searchRow = tableData.searchTerm ? [`Search: ${tableData.searchTerm}`] : [];
    const emptyRow = [''];
    const headerRow = tableData.headers;

    // Insert metadata rows at the beginning
    XLSX.utils.sheet_add_aoa(tableWorksheet, [titleRow], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(tableWorksheet, [dateRow], { origin: 'A2' });
    if (filterRow.length > 0) {
      XLSX.utils.sheet_add_aoa(tableWorksheet, [filterRow], { origin: 'A3' });
    }
    if (searchRow.length > 0) {
      XLSX.utils.sheet_add_aoa(tableWorksheet, [searchRow], { origin: 'A4' });
    }
    XLSX.utils.sheet_add_aoa(tableWorksheet, [emptyRow], { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(tableWorksheet, [headerRow], { origin: 'A6' });

    // Style the title row
    if (!tableWorksheet['A1']) tableWorksheet['A1'] = { v: '', t: 's' };
    tableWorksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };

    // Style the header row
    tableData.headers.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 5, c: index });
      if (!tableWorksheet[cellRef]) tableWorksheet[cellRef] = { v: '', t: 's' };
      tableWorksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6F3FF' } },
        alignment: { horizontal: 'center' }
      };
    });

    // === CHART DATA SHEET ===
    const chartSheetData = [
      ['Category', 'Quantity', 'Percentage', 'Color'],
      ...chartData.chartData.labels.map((label, index) => {
        const value = chartData.chartData.datasets[0].data[index];
        const total = chartData.chartData.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        const color = chartData.chartData.datasets[0].backgroundColor[index];
        return [label, value, `${percentage}%`, color];
      })
    ];

    const chartWorksheet = XLSX.utils.aoa_to_sheet(chartSheetData);

    // Set column widths for chart
    chartWorksheet['!cols'] = [
      { wch: 20 }, // Category
      { wch: 15 }, // Quantity
      { wch: 15 }, // Percentage
      { wch: 10 }  // Color
    ];

    // Style the header row for chart
    ['A1', 'B1', 'C1', 'D1'].forEach(cellRef => {
      if (!chartWorksheet[cellRef]) chartWorksheet[cellRef] = { v: '', t: 's' };
      chartWorksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6F3FF' } },
        alignment: { horizontal: 'center' }
      };
    });

    // Add title and metadata for chart
    const chartTitleRow = [
      `${chartData.title} - ${chartData.reportType === 'current' ? 'Current Stock Balance Report' : `Stock Balance as of Date Report (${chartData.asOfDate ? new Date(chartData.asOfDate).toLocaleDateString() : 'Date'})`}`
    ];
    const chartDateRow = [`Generated on: ${new Date().toLocaleDateString()}`];
    const chartEmptyRow = [''];

    // Insert metadata rows at the beginning
    XLSX.utils.sheet_add_aoa(chartWorksheet, [chartTitleRow], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(chartWorksheet, [chartDateRow], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(chartWorksheet, [chartEmptyRow], { origin: 'A3' });

    // Style the title row for chart
    if (!chartWorksheet['A1']) chartWorksheet['A1'] = { v: '', t: 's' };
    chartWorksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, tableWorksheet, 'Stock Balance Data');
    XLSX.utils.book_append_sheet(workbook, chartWorksheet, 'Chart Summary');

    // Generate filename
    const filename = `${tableData.title.replace(/\s+/g, '-').toLowerCase()}-complete-${tableData.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    // Error exporting complete report to Excel
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
