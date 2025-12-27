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
  Mail,
  Globe,
  Calendar,
  MapPin,
  Download,
  Maximize2,
  Minimize2,
  Printer
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
import { useAuth } from '../contexts/AuthContext';
import { customerGroupService } from '../services/customerGroupService';
import { customerListReportService, CustomerListReportFilters } from '../services/customerListReportService';
import { exportCompleteReportToExcel } from '../utils/excelExporter';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CustomerListReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CustomerListReportFilters>({
    customerGroupId: '',
    status: '',
    search: '',
    sortBy: 'fullName',
    sortOrder: 'asc'
  });

  const [queryFilters, setQueryFilters] = useState<CustomerListReportFilters>(filters);
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
    customerGroup: true,
    receivableAccount: false,
    phone: true,
    email: true,
    website: false,
    fax: false,
    birthday: false,
    loyaltyCard: false,
    loyaltyCardPoints: false,
    address: true,
    accountBalance: true,
    status: false,
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  // Fetch reference data
  const { data: customerGroups } = useQuery({
    queryKey: ['customer-groups'],
    queryFn: () => customerGroupService.getCustomerGroups(1, 1000),
    enabled: !!user
  });

  // Fetch customer list report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['customer-list-report', queryFilters, manualFetchTrigger],
    queryFn: async () => {
      const response = await customerListReportService.getCustomerListReport(queryFilters);
      return response;
    },
    enabled: manualFetchTrigger > 0,
    retry: 1
  });


  const handleFilterChange = (key: keyof CustomerListReportFilters, value: any) => {
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
      (item.customerGroup || '').toLowerCase().includes(searchLower) ||
      (item.phone || '').toLowerCase().includes(searchLower) ||
      (item.email || '').toLowerCase().includes(searchLower) ||
      (item.website || '').toLowerCase().includes(searchLower) ||
      (item.fax || '').toLowerCase().includes(searchLower) ||
      (item.address || '').toLowerCase().includes(searchLower) ||
      (item.loyaltyCard || '').toLowerCase().includes(searchLower)
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
        link.download = `customer-distribution-by-group-${new Date().toISOString().split('T')[0]}.png`;
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
        pdf.text('Customer Distribution by Group', 20, 20);
        
        // Add report info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Customer List Report', 20, 30);
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
        pdf.save(`customer-distribution-by-group-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      // Error downloading chart
    } finally {
      setIsChartDownloading(false);
    }
  };

  // Toggle fullscreen
  const toggleChartFullscreen = () => {
    const chartContainer = document.getElementById('customer-chart-container');
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
        title: 'Customer List Report',
        reportType: 'current' as const,
        filters: queryFilters,
        searchTerm: searchTerm
      };

      // Prepare chart data for Excel export
      const chartExportData = {
        chartData: chartData,
        title: 'Customer Distribution by Group',
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
          <title>Customer Distribution by Group</title>
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
            <h1>Customer Distribution by Group</h1>
            <p>Customer List Report</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="chart">
            <img src="${image}" alt="Customer Distribution by Group" style="max-width: 100%; height: auto;" />
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
          'Customer ID', 'Full Name', 'Customer Group', 'Receivable Account', 
          'Phone', 'Email', 'Website', 'Fax', 'Birthday', 'Loyalty Card', 
          'Loyalty Card Points', 'Address', 'Account Balance', 'Status'
        ];
        
        const tableExportData = {
          data: filteredData,
          headers: tableHeaders,
          title: 'Customer List Report',
          reportType: 'current' as const,
          filters: queryFilters,
          searchTerm: searchTerm
        };
        
        // Prepare chart data for Excel export
        const chartExportData = {
          chartData: chartData,
          title: 'Customers by Group',
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
        const { generateCustomerListPDF } = await import('../utils/pdfGenerator');
        
        // Pass exactly what the user sees
        const exportData = {
          data: filteredData, // Only visible/filtered data
          filters: queryFilters,
          searchTerm,
          visibleColumns: visibleColumns, // Which columns are shown
          sortConfig: sortConfig, // Current sort order
          reportType: 'current' as const
        };
        
        const blob = await generateCustomerListPDF(exportData);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-list-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        // Error exporting PDF
        alert('Failed to export PDF. Please try again.');
      }
    }
  };

  const formatNumber = (num: number) => {
    if (isNaN(num) || num === null || num === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Helper function to format display values
  const formatDisplayValue = (value: any) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return '--';
    }
    return value;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
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

              {/* Status */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4 mr-2" />
                  Status
                </label>
                <Select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value as 'active' | 'inactive' | 'all')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
              {error instanceof Error ? error.message : 'An error occurred while fetching customer data.'}
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
      {reportData?.data && reportData.data.length > 0 && (
        <Card title="Customer List Results" className="p-6">
          {/* Total Customers Count */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                Total Customers: {reportData.data.length}
              </span>
            </div>
          </div>

          {/* Customer Distribution Chart - Collapsible */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Distribution Chart</h3>
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
              <div id="customer-chart-container" className="relative">
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
                                text: 'Customer Distribution by Group',
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
                placeholder="Search customers by ID, name, phone, email, group..."
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
              <span className="ml-2 text-gray-600">Loading customer data...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load customer data. Please try again.</p>
            </div>
          )}

          {/* Empty State */}
          {!reportData?.data || reportData.data.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No customer data found. Click "Get Data" to load customers.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10 border-b-2 border-blue-200">
                <tr>
                  {visibleColumns.customerId && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('customer_id')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Customer ID</span>
                        {getSortIcon('customer_id')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.fullName && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-48"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Full Name</span>
                        {getSortIcon('full_name')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.customerGroup && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-40"
                      onClick={() => handleSort('customerGroup')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Customer Group</span>
                        {getSortIcon('customerGroup')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.receivableAccount && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-40"
                      onClick={() => handleSort('receivableAccount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Receivable Account</span>
                        {getSortIcon('receivableAccount')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.phone && (
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 hover:text-blue-800 select-none transition-colors duration-200 w-32"
                      onClick={() => handleSort('phone_number')}
                    >
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>Phone</span>
                        {getSortIcon('phone_number')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.email && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                        {getSortIcon('email')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.website && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('website')}
                    >
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                        {getSortIcon('website')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.fax && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('fax')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fax</span>
                        {getSortIcon('fax')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.birthday && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('birthday')}
                    >
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Birthday</span>
                        {getSortIcon('birthday')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.loyaltyCard && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('loyaltyCard')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Loyalty Card</span>
                        {getSortIcon('loyaltyCard')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.loyaltyCardPoints && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('loyaltyCardPoints')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Points</span>
                        {getSortIcon('loyaltyCardPoints')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.address && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Address</span>
                        {getSortIcon('address')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.accountBalance && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('accountBalance')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Account Balance</span>
                        {getSortIcon('accountBalance')}
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    {visibleColumns.customerId && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDisplayValue(customer.customerId)}
                      </td>
                    )}
                    {visibleColumns.fullName && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.fullName)}
                      </td>
                    )}
                    {visibleColumns.customerGroup && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.customerGroup)}
                      </td>
                    )}
                    {visibleColumns.receivableAccount && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.receivableAccount)}
                      </td>
                    )}
                    {visibleColumns.phone && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.phone)}
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.email)}
                      </td>
                    )}
                    {visibleColumns.website && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.website)}
                      </td>
                    )}
                    {visibleColumns.fax && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.fax)}
                      </td>
                    )}
                    {visibleColumns.birthday && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.birthday)}
                      </td>
                    )}
                    {visibleColumns.loyaltyCard && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.loyaltyCard)}
                      </td>
                    )}
                    {visibleColumns.loyaltyCardPoints && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(customer.loyaltyCardPoints)}
                      </td>
                    )}
                    {visibleColumns.address && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDisplayValue(customer.address)}
                      </td>
                    )}
                    {visibleColumns.accountBalance && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.accountBalance)}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default CustomerListReport;
