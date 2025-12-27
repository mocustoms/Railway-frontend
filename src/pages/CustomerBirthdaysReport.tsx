import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  ArrowUpDown,
  ArrowLeft,
  Search,
  Phone,
  Calendar,
  MapPin,
  Gift,
  Download,
  Maximize2,
  Minimize2,
  Printer,
  CreditCard
} from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import { useQuery } from '@tanstack/react-query';
import { customerGroupService } from '../services/customerGroupService';
import loyaltyCardService from '../services/loyaltyCardService';
import { customerBirthdaysReportService, CustomerBirthdayFilters } from '../services/customerBirthdaysReportService';
import { exportCompleteReportToExcel } from '../utils/excelExporter';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CustomerBirthdaysReport: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CustomerBirthdayFilters>({
    customerGroupId: '',
    loyaltyCardId: '',
    daysBefore: 30,
    search: ''
  });

  const [queryFilters, setQueryFilters] = useState<CustomerBirthdayFilters>(filters);
  const [manualFetchTrigger, setManualFetchTrigger] = useState(0);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(true);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [isChartDownloading, setIsChartDownloading] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    customerId: true,
    fullName: true,
    phone: true,
    address: true,
    daysLeft: true,
    birthday: true,
    customerGroup: false,
    loyaltyCard: false
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: 'daysLeft',
    direction: 'asc'
  });

  // Fetch customer groups for filter
  const { data: customerGroups } = useQuery({
    queryKey: ['customer-groups'],
    queryFn: async () => {
      const response = await customerGroupService.getCustomerGroups();
      return response;
    },
    retry: 1
  });

  // Fetch loyalty card configs for filter
  const { data: loyaltyCards } = useQuery({
    queryKey: ['loyalty-card-configs'],
    queryFn: async () => {
      const response = await loyaltyCardService.getLoyaltyCardConfigs();
      return response;
    },
    retry: 1
  });

  // Fetch customer birthdays report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['customer-birthdays-report', queryFilters, manualFetchTrigger],
    queryFn: async () => {
      const response = await customerBirthdaysReportService.getCustomerBirthdays(queryFilters);
      return response;
    },
    enabled: manualFetchTrigger > 0,
    retry: 1
  });


  const handleFilterChange = (key: keyof CustomerBirthdayFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleManualFetch = () => {
    setQueryFilters(filters);
    setManualFetchTrigger(prev => prev + 1);
  };

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!reportData?.data || !searchTerm.trim()) {
      return reportData?.data || [];
    }

    const searchLower = searchTerm.toLowerCase();
    return reportData.data.filter(item => 
      (item.customerId || '').toLowerCase().includes(searchLower) ||
      (item.fullName || '').toLowerCase().includes(searchLower) ||
      (item.phone || '').toLowerCase().includes(searchLower) ||
      (item.address || '').toLowerCase().includes(searchLower) ||
      (item.birthday || '').toLowerCase().includes(searchLower)
    );
  }, [reportData?.data, searchTerm]);

  // Process data for pie chart by customer group
  const chartData = React.useMemo(() => {
    if (!reportData?.data || reportData.data.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Customers by Group',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      };
    }

    // Group data by customer group and count customers
    const groupTotals = reportData.data.reduce((acc: { [key: string]: number }, item) => {
      const group = item.customerGroup || 'No Group';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    // Convert to arrays for Chart.js
    const labels = Object.keys(groupTotals);
    const data = Object.values(groupTotals);

    // Generate colors for each group
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];

    const backgroundColor = labels.map((_, index) => colors[index % colors.length]);
    const borderColor = backgroundColor.map(color => color);

    return {
      labels,
      datasets: [{
        label: 'Customers by Group',
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    };
  }, [reportData?.data]);

  // Chart enhancement functions
  const chartRef = React.useRef<ChartJS<"pie">>(null);

  // Download chart as PNG
  const downloadChart = async (format: 'png' | 'pdf') => {
    if (!chartRef.current) return;
    
    setIsChartDownloading(true);
    try {
      const chart = chartRef.current;
      const image = chart.toBase64Image('image/png', 1);
      
      if (format === 'png') {
        // Download as PNG
        const link = document.createElement('a');
        link.href = image;
        link.download = `customer-birthdays-by-group-${new Date().toISOString().split('T')[0]}.png`;
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
        pdf.text('Customer Birthdays by Group', 20, 20);
        
        // Add report info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Customer Birthdays Report', 20, 30);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        
        // Add chart image
        const imgWidth = 200;
        const imgHeight = 120;
        pdf.addImage(image, 'PNG', 20, 45, imgWidth, imgHeight);
        
        // Add group summary
        let yPosition = 180;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Group Summary:', 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        chartData.labels.forEach((label, index) => {
          yPosition += 8;
          const value = chartData.datasets[0].data[index];
          const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          pdf.text(`${label}: ${value.toLocaleString()} customers (${percentage}%)`, 25, yPosition);
        });
        
        // Save PDF
        pdf.save(`customer-birthdays-by-group-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      // Error downloading chart
    } finally {
      setIsChartDownloading(false);
    }
  };

  // Toggle fullscreen
  const toggleChartFullscreen = () => {
    const chartContainer = document.getElementById('customer-birthdays-chart-container');
    if (!chartContainer) return;

    if (!document.fullscreenElement) {
      chartContainer.requestFullscreen().then(() => {
        setIsChartFullscreen(true);
      }).catch(err => {
        // Error attempting to enable full-screen mode
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsChartFullscreen(false);
      });
    }
  };

  // Export chart to Excel
  const exportChartToExcelFile = async () => {
    setIsChartDownloading(true);
    try {
      // Prepare minimal table data for Excel export
      const tableExportData = {
        data: [],
        headers: [],
        title: 'Customer Birthdays Report',
        reportType: 'current' as const,
        filters: queryFilters,
        searchTerm: searchTerm
      };

      // Prepare chart data for Excel export
      const chartExportData = {
        chartData: chartData,
        title: 'Customer Birthdays by Group',
        reportType: 'current' as const
      };
      
      const result = exportCompleteReportToExcel(tableExportData, chartExportData);
      
      if (result.success) {
        // Chart Excel export successful
      } else {
        // Chart Excel export failed
      }
    } catch (error) {
      // Error exporting chart to Excel
    } finally {
      setIsChartDownloading(false);
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
          <title>Customer Birthdays by Group</title>
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
            <h1>Customer Birthdays by Group</h1>
            <p>Customer Birthdays Report</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="chart">
            <img src="${image}" alt="Customer Birthdays by Group" style="max-width: 100%; height: auto;" />
          </div>
          <div class="summary">
            <h3>Group Summary:</h3>
            ${chartData.labels.map((label, index) => {
              const value = chartData.datasets[0].data[index];
              const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `<div class="summary-item">${label}: ${value.toLocaleString()} customers (${percentage}%)</div>`;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      try {
        // Prepare table data for Excel export
        const tableHeaders = [
          'Customer ID', 'Full Name', 'Phone', 'Address', 'Days Left', 'Birthday'
        ];
        
        const tableExportData = {
          data: filteredData,
          headers: tableHeaders,
          title: 'Customer Birthdays Report',
          reportType: 'current' as const,
          filters: queryFilters,
          searchTerm: searchTerm
        };
        
        // Prepare chart data for Excel export
        const chartExportData = {
          chartData: chartData,
          title: 'Customer Birthdays by Group',
          reportType: 'current' as const
        };
        
        // Export complete report with both table and chart data
        const result = exportCompleteReportToExcel(tableExportData, chartExportData);
        
        if (result.success) {
          // Excel export successful
        } else {
          // Excel export failed
          alert('Failed to export Excel. Please try again.');
        }
      } catch (error) {
        // Error exporting Excel
        alert('Failed to export Excel. Please try again.');
      }
    } else if (format === 'pdf') {
      try {
        // Dynamic import to avoid build issues
        const { generateCustomerBirthdaysPDF } = await import('../utils/pdfGenerator');
        
        // Pass exactly what the user sees
        const exportData = {
          data: filteredData, // Only visible/filtered data
          filters: queryFilters,
          searchTerm,
          visibleColumns: visibleColumns, // Which columns are shown
          sortConfig: sortConfig, // Current sort order
          reportType: 'current' as const
        };
        
        const blob = await generateCustomerBirthdaysPDF(exportData);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-birthdays-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        // Error exporting PDF
        alert(`Failed to export PDF. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };


  // Helper function to format display values
  const formatDisplayValue = (value: any) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return '--';
    }
    return value;
  };

  const formatDaysLeft = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
  };

  // Sorting functions
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          key,
          direction: 'asc'
        };
      }
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-blue-600" /> : 
      <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const sortData = (data: any[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key!];
      let bValue = b[sortConfig.key!];

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedData = sortData(filteredData);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <button
          onClick={() => navigate('/reports/sales')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Sales Reports
        </button>
      </div>

      {/* Report Parameters */}
      <Card className="p-6">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Parameters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span className="text-sm">
              {isFiltersCollapsed ? 'Show Filters' : 'Hide Filters'}
            </span>
            {isFiltersCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsible Content */}
        {!isFiltersCollapsed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Customer Group */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  Customer Group
                </label>
                <Select
                  value={filters.customerGroupId || ''}
                  onChange={(e) => handleFilterChange('customerGroupId', e.target.value)}
                >
                  <option value="">All Groups</option>
                  {customerGroups?.data?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.group_name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Loyalty Card */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Gift className="h-4 w-4 mr-2" />
                  Loyalty Card
                </label>
                <Select
                  value={filters.loyaltyCardId || ''}
                  onChange={(e) => handleFilterChange('loyaltyCardId', e.target.value)}
                >
                  <option value="">All Cards</option>
                  {loyaltyCards?.data?.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.loyalty_card_name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Days Before */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Days Before
                </label>
                <Select
                  value={filters.daysBefore || 30}
                  onChange={(e) => handleFilterChange('daysBefore', parseInt(e.target.value))}
                >
                  <option value={7}>Next 7 days</option>
                  <option value={14}>Next 14 days</option>
                  <option value={30}>Next 30 days</option>
                  <option value={60}>Next 60 days</option>
                  <option value={90}>Next 90 days</option>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleManualFetch}
                className="flex items-center space-x-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Get Data</span>
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 text-lg font-medium mb-2">
              Error Loading Data
            </div>
            <div className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An error occurred while fetching customer birthdays data.'}
            </div>
            <Button
              onClick={handleManualFetch}
              className="flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {reportData?.data && reportData.data.length > 0 ? (
        <Card title="Customer Birthdays Results" className="p-6">
          {/* Total Customers Count */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Total Customers: {reportData.data.length}
              </span>
            </div>
          </div>

          {/* Customer Birthdays Distribution Chart - Collapsible */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Birthdays Distribution Chart</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChartCollapsed(!isChartCollapsed)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <span className="text-sm">
                  {isChartCollapsed ? 'Show Chart' : 'Hide Chart'}
                </span>
                {isChartCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Collapsible Chart Content */}
            {!isChartCollapsed && (
              <div id="customer-birthdays-chart-container" className="relative">
                {/* Chart Controls */}
                <div className="flex justify-end space-x-2 mb-3">
                  <button
                    onClick={() => downloadChart('png')}
                    disabled={isChartDownloading}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    title="Download as PNG"
                  >
                    <Download size={12} />
                    <span>PNG</span>
                  </button>
                  
                  <button
                    onClick={() => downloadChart('pdf')}
                    disabled={isChartDownloading}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    title="Download as PDF"
                  >
                    <Download size={12} />
                    <span>PDF</span>
                  </button>
                  
                  <button
                    onClick={exportChartToExcelFile}
                    disabled={isChartDownloading}
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
                    onClick={toggleChartFullscreen}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    title={isChartFullscreen ? "Exit Full Screen" : "Full Screen"}
                  >
                    {isChartFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    <span>{isChartFullscreen ? 'Exit' : 'Full'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="h-64">
                      {chartData.labels.length > 0 ? (
                        <Pie 
                          ref={chartRef}
                          data={chartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right' as const,
                                labels: {
                                  usePointStyle: true,
                                  padding: 15,
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              title: {
                                display: true,
                                text: 'Customer Birthdays by Group',
                                font: {
                                  size: 14,
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
                                    return `${label}: ${value.toLocaleString()} customers (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-2" />
                            <p>No data available for chart</p>
                            <p className="text-sm">Apply filters and click "Get Data" to see the chart</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Group Summary</h4>
                    <div className="space-y-1">
                      {chartData.labels.length > 0 ? (
                        chartData.labels.map((label, index) => (
                          <div key={label} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                              ></div>
                              <span className="text-sm text-gray-700">{label}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {chartData.datasets[0].data[index].toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <p className="text-sm">No data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loading Overlay */}
                {isChartDownloading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <div className="text-sm text-gray-600">Downloading...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Customers */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search customers by ID, name, phone, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredData.length} of {reportData.data.length} customers
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {/* More Columns Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('more-columns-dropdown');
                    if (dropdown) {
                      dropdown.classList.toggle('hidden');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <MoreHorizontal size={16} className="mr-1" />
                  More Columns
                </button>
                
                {/* Dropdown Menu */}
                <div
                  id="more-columns-dropdown"
                  className="hidden absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] transition-all duration-200"
                  style={{
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    maxHeight: '300px'
                  }}
                >
                  <div className="py-2">
                    {/* Toggle All Button */}
                    <button
                      onClick={() => {
                        const allVisible = Object.values(visibleColumns).every(v => v);
                        const newState = Object.keys(visibleColumns).reduce((acc, key) => ({
                          ...acc,
                          [key]: !allVisible
                        }), {} as typeof visibleColumns);
                        setVisibleColumns(newState);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                    >
                      {Object.values(visibleColumns).every(v => v) ? 'Hide All Optional' : 'Show All'}
                    </button>
                    
                    {/* Scrollable Column List */}
                    <div className="max-h-64 overflow-y-auto">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setVisibleColumns(prev => ({
                              ...prev,
                              [key]: !prev[key as keyof typeof prev]
                            }));
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between text-gray-700"
                        >
                          <span className="truncate capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {visible ? (
                              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                            ) : (
                              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={!reportData?.data || reportData.data.length === 0}
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!reportData?.data || reportData.data.length === 0}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <FileText size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading customer birthdays data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load customer birthdays data. Please try again.</p>
            </div>
          )}

          {/* Empty State */}
          {!reportData?.data || reportData.data.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No customer birthdays data found. Click "Get Data" to load customer birthdays.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10 border-b-2 border-blue-200">
                <tr>
                  {visibleColumns.customerId && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('customerId')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Customer ID</span>
                        {getSortIcon('customerId')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.fullName && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-48"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Full Name</span>
                        {getSortIcon('fullName')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.phone && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                        {getSortIcon('phone')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.address && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-48"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                        {getSortIcon('address')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.daysLeft && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('daysLeft')}
                    >
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Days Left</span>
                        {getSortIcon('daysLeft')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.birthday && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('birthday')}
                    >
                      <div className="flex items-center space-x-1">
                        <Gift className="h-4 w-4" />
                        <span>Birthday</span>
                        {getSortIcon('birthday')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.customerGroup && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-40"
                      onClick={() => handleSort('customerGroup')}
                    >
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>Customer Group</span>
                        {getSortIcon('customerGroup')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.loyaltyCard && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-40"
                      onClick={() => handleSort('loyaltyCard')}
                    >
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-4 w-4" />
                        <span>Loyalty Card</span>
                        {getSortIcon('loyaltyCard')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.length > 0 ? (
                  sortedData.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      {visibleColumns.customerId && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDisplayValue(customer.customerId)}
                        </td>
                      )}
                      {visibleColumns.fullName && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.fullName)}
                        </td>
                      )}
                      {visibleColumns.phone && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.phone)}
                        </td>
                      )}
                      {visibleColumns.address && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.address)}
                        </td>
                      )}
                      {visibleColumns.daysLeft && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.daysLeft === 0 
                              ? 'bg-red-100 text-red-800' 
                              : customer.daysLeft <= 7
                              ? 'bg-orange-100 text-orange-800'
                              : customer.daysLeft <= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {formatDaysLeft(customer.daysLeft)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.birthday && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.birthday)}
                        </td>
                      )}
                      {visibleColumns.customerGroup && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.customerGroup)}
                        </td>
                      )}
                      {visibleColumns.loyaltyCard && (
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayValue(customer.loyaltyCard)}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={Object.values(visibleColumns).filter(Boolean).length} 
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <Gift className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Birthdays Found</h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                          There are no customers with birthdays in your database. 
                          Add customer birthday information to see birthday reports.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      ) : (
        <Card title="Customer Birthdays Results" className="p-6">
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <Gift className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Customer Birthdays Found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-4">
                There are no customers with birthdays in your database. 
                Add customer birthday information to see birthday reports and track upcoming celebrations.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomerBirthdaysReport;