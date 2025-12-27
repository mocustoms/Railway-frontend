import React, { useRef, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, Maximize2, Minimize2, Printer, FileSpreadsheet } from 'lucide-react';
import { exportChartToExcel } from '../../utils/excelExporter';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface EnhancedStockBalanceChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  title?: string;
  height?: number;
  reportType?: 'current' | 'historical';
  asOfDate?: string;
}

const EnhancedStockBalanceChart: React.FC<EnhancedStockBalanceChartProps> = ({ 
  data, 
  title = "Stock Balance by Category", 
  height = 300,
  reportType = 'current',
  asOfDate
}) => {
  const chartRef = useRef<ChartJS<"pie">>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Download chart as PNG
  const downloadChart = async (format: 'png' | 'pdf') => {
    if (!chartRef.current) return;
    
    setIsDownloading(true);
    try {
      const chart = chartRef.current;
      const image = chart.toBase64Image('image/png', 1);
      
      if (format === 'png') {
        // Download as PNG
        const link = document.createElement('a');
        link.href = image;
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${reportType}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        // For PDF, we'll use a simple approach with jsPDF
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
        
        // Add title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 20, 20);
        
        // Add report info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const reportInfo = reportType === 'current' 
          ? 'Current Stock Balance Report' 
          : `Stock Balance as of Date Report (${asOfDate ? new Date(asOfDate).toLocaleDateString() : 'Date'})`;
        pdf.text(reportInfo, 20, 30);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Add chart image
        const imgWidth = 200;
        const imgHeight = 120;
        pdf.addImage(image, 'PNG', 20, 45, imgWidth, imgHeight);
        
        // Add category summary
        let yPosition = 180;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Category Summary:', 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        data.labels.forEach((label, index) => {
          yPosition += 8;
          const value = data.datasets[0].data[index];
          const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          pdf.text(`${label}: ${value.toLocaleString()} (${percentage}%)`, 25, yPosition);
        });
        
        // Save PDF
        pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      // Error downloading chart
    } finally {
      setIsDownloading(false);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    if (!document.fullscreenElement) {
      chartContainer.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        // Error attempting to enable full-screen mode
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Export chart to Excel
  const exportChartToExcelFile = async () => {
    setIsDownloading(true);
    try {
      const chartExportData = {
        chartData: data,
        title: title,
        reportType: reportType,
        asOfDate: asOfDate
      };
      
      const result = exportChartToExcel(chartExportData);
      
      if (result.success) {
        // Chart Excel export successful
      } else {
        // Chart Excel export failed
      }
    } catch (error) {
      // Error exporting chart to Excel
    } finally {
      setIsDownloading(false);
    }
  };

  // Print chart
  const printChart = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const chart = chartRef.current;
    if (!chart) return;

    const image = chart.toBase64Image('image/png', 1);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            .chart { text-align: center; }
            .summary { margin-top: 20px; }
            .summary h3 { margin-bottom: 10px; }
            .summary-item { margin: 5px 0; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${reportType === 'current' 
              ? 'Current Stock Balance Report' 
              : `Stock Balance as of Date Report (${asOfDate ? new Date(asOfDate).toLocaleDateString() : 'Date'})`}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="chart">
            <img src="${image}" alt="${title}" style="max-width: 100%; height: auto;" />
          </div>
          <div class="summary">
            <h3>Category Summary:</h3>
            ${data.labels.map((label, index) => {
              const value = data.datasets[0].data[index];
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `<div class="summary-item">${label}: ${value.toLocaleString()} (${percentage}%)</div>`;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div id="chart-container" className="relative">
      {/* Chart Controls */}
      <div className="flex justify-end space-x-2 mb-3">
        <button
          onClick={() => downloadChart('png')}
          disabled={isDownloading}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          title="Download as PNG"
        >
          <Download size={12} />
          <span>PNG</span>
        </button>
        
        <button
          onClick={() => downloadChart('pdf')}
          disabled={isDownloading}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          title="Download as PDF"
        >
          <Download size={12} />
          <span>PDF</span>
        </button>
        
        <button
          onClick={exportChartToExcelFile}
          disabled={isDownloading}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          title="Export to Excel"
        >
          <FileSpreadsheet size={12} />
          <span>Excel</span>
        </button>
        
        <button
          onClick={printChart}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          title="Print Chart"
        >
          <Printer size={12} />
          <span>Print</span>
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
          title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span>{isFullscreen ? 'Exit' : 'Full'}</span>
        </button>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px`, width: '100%' }}>
        <Pie ref={chartRef} data={data} options={options} />
      </div>

      {/* Loading Overlay */}
      {isDownloading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-sm text-gray-600">Downloading...</div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStockBalanceChart;
