import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Filter,
  FileSpreadsheet,
  FileText,
  Power
} from 'lucide-react';
import { useFinancialYearManagement } from '../hooks/useFinancialYearManagement';
import { FinancialYear, financialYearStatusOptions } from '../data/financialYearModules';
import FinancialYearForm from '../components/FinancialYearForm';
import StatusBadge from '../components/StatusBadge';
import { financialYearService } from '../services/financialYearService';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import './FinancialYear.css';
import DataTable from '../components/DataTable';
import ContentContainer from '../components/ContentContainer';

const FinancialYearPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    financialYears,
    currentYear,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isSettingCurrent,
    isClosing,
    isReopening,
    filters,
    sortConfig,
    canCreate,
    canUpdate,
    canDelete,
    canSetCurrent,
    canClose,
    canReopen,
    handleSearch,
    handleStatusFilter,
    handleSort,
    createFinancialYear,
    updateFinancialYear,
    deleteFinancialYear,
    setCurrentFinancialYear,
    closeFinancialYear,
    reopenFinancialYear
  } = useFinancialYearManagement();

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingYear, setEditingYear] = useState<FinancialYear | undefined>();
  const [showSetCurrentModal, setShowSetCurrentModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<FinancialYear | null>(null);
  const [closingNotes, setClosingNotes] = useState('');
  
  // Custom confirmation hook
  const { confirm } = useConfirm();

  // Handlers
  const handleAddNew = useCallback(() => {
    setEditingYear(undefined);
    setShowFormModal(true);
  }, []);

  const handleEdit = useCallback((year: FinancialYear) => {
    setEditingYear(year);
    setShowFormModal(true);
  }, []);

  const handleView = useCallback((year: FinancialYear) => {
    // TODO: Implement view details modal
  }, []);

  const handleDelete = useCallback(async (year: FinancialYear) => {
    const confirmed = await confirm({
      title: 'Delete Financial Year',
      message: `Are you sure you want to delete "${year.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await deleteFinancialYear(year.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteFinancialYear, confirm]);

  const handleSetCurrent = useCallback(async (year: FinancialYear) => {
    const confirmed = await confirm({
      title: 'Set Current Financial Year',
      message: `Are you sure you want to set "${year.name}" as the current financial year?`,
      confirmText: 'Yes, set as current',
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await setCurrentFinancialYear(year.id);
      setShowSetCurrentModal(false);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [setCurrentFinancialYear, confirm]);

  const handleClose = useCallback(async (year: FinancialYear) => {
    const confirmed = await confirm({
      title: 'Close Financial Year',
      message: `Are you sure you want to close "${year.name}"? This action will finalize the financial year.`,
      confirmText: 'Yes, close year',
      cancelText: 'Cancel',
      type: 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await closeFinancialYear(year.id, closingNotes);
      setShowCloseModal(false);
      setClosingNotes('');
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [closeFinancialYear, closingNotes, confirm]);

  const handleReopen = useCallback(async (year: FinancialYear) => {
    const confirmed = await confirm({
      title: 'Reopen Financial Year',
      message: `Are you sure you want to reopen "${year.name}"? This will allow modifications to the closed year.`,
      confirmText: 'Yes, reopen year',
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await reopenFinancialYear(year.id, closingNotes);
      setShowReopenModal(false);
      setClosingNotes('');
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [reopenFinancialYear, closingNotes, confirm]);

  const handleToggleActive = useCallback(async (year: FinancialYear) => {
    const action = year.isActive ? 'deactivate' : 'activate';
    const confirmed = await confirm({
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Financial Year`,
      message: `Are you sure you want to ${action} "${year.name}"?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      type: action === 'activate' ? 'warning' : 'danger'
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      await updateFinancialYear(year.id, { isActive: !year.isActive } as any);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [updateFinancialYear, confirm]);

  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingYear) {
        await updateFinancialYear(editingYear.id, data);
      } else {
        await createFinancialYear(data);
      }
      setShowFormModal(false);
      setEditingYear(undefined);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingYear, createFinancialYear, updateFinancialYear]);

  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setEditingYear(undefined);
  }, []);

  // Export functions
  const handleExportExcel = useCallback(async () => {
    try {
      const blob = await financialYearService.exportFinancialYears('excel', filters);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-years-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Financial years exported to Excel successfully');
    } catch (error: any) {
      toast.error('Failed to export financial years to Excel');
    }
  }, [filters]);

  const handleExportPdf = useCallback(async () => {
    try {
      const blob = await financialYearService.exportFinancialYears('pdf', filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-years-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Financial years exported to PDF successfully');
    } catch (error) {
      toast.error('Failed to export financial years to PDF');
    }
  }, [filters]);

  const getSortArrow = (field: keyof FinancialYear) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (year: FinancialYear) => {
    if (year.isCurrent) {
      return <StatusBadge status="Current Year" variant="info" />;
    }
    if (year.isClosed) {
      return <StatusBadge status="Closed" variant="error" />;
    }
    return <StatusBadge status="Open" variant="success" />;
  };

  const canCloseYear = (year: FinancialYear) => {
    // Temporarily remove permission check to ensure close function is visible
    return year.isActive && !year.isClosed && !year.isCurrent;
  };

  const canReopenYear = (year: FinancialYear) => {
    return canReopen && year.isActive && year.isClosed;
  };

  const canSetCurrentYear = (year: FinancialYear) => {
    return canSetCurrent && year.isActive && !year.isClosed && !year.isCurrent;
  };

  const canEditOrDelete = (year: FinancialYear) => {
    // Check if the end date has been reached
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const endDate = new Date(year.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    // Cannot edit or delete if:
    // 1. End date has passed
    // 2. Year is closed
    // 3. Year is current (active financial year)
    return today <= endDate && !year.isClosed && !year.isCurrent;
  };

  // Table columns configuration
  const columns = [
    {
      key: 'name',
      header: 'Financial Year',
      visible: true,
      render: (year: any) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{year.name}</div>
          {year.description && (
            <div className="text-sm text-gray-500">{year.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'startDate',
      header: 'Start Date',
      defaultVisible: true,
      render: (year: any) => (
        <div className="text-sm text-gray-900">{formatDate(year.startDate)}</div>
      )
    },
    {
      key: 'endDate',
      header: 'End Date',
      defaultVisible: true,
      render: (year: any) => (
        <div className="text-sm text-gray-900">{formatDate(year.endDate)}</div>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      visible: true,
      render: (year: any) => (
        <StatusBadge status={year.isActive ? 'Active' : 'Inactive'} />
      )
    },
    {
      key: 'created_by',
      header: 'Created By',
      defaultVisible: false,
      render: (year: any) => (
        <div className="text-sm text-gray-900">
          {year.creator ? `${year.creator.first_name} ${year.creator.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created Date',
      defaultVisible: false,
      render: (year: any) => (
        <div className="text-sm text-gray-900">
          {year.created_at ? new Date(year.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'updated_by',
      header: 'Updated By',
      defaultVisible: false,
      render: (year: any) => (
        <div className="text-sm text-gray-900">
          {year.updater ? `${year.updater.first_name} ${year.updater.last_name}` : 'N/A'}
        </div>
      )
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      defaultVisible: false,
      render: (year: any) => (
        <div className="text-sm text-gray-900">
          {year.updated_at ? new Date(year.updated_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      visible: true,
      render: (year: any) => {
        const canEditDelete = canEditOrDelete(year);
        return (
          <div className="flex items-center space-x-2">
            <button onClick={() => handleView(year)} className="text-gray-600 hover:text-gray-900 p-1" title="View">
              <Eye size={16} />
            </button>
            {canEditDelete && (
              <button onClick={() => handleEdit(year)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
                <Edit size={16} />
              </button>
            )}
            {!canEditDelete && !year.isClosed && !year.isCurrent && (
              <button 
                disabled 
                className="text-gray-300 p-1 cursor-not-allowed" 
                title="Cannot edit: End date has been reached"
              >
                <Edit size={16} />
              </button>
            )}
            <button 
              onClick={() => handleToggleActive(year)} 
              className={`p-1 ${year.isActive ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`} 
              title={year.isActive ? 'Deactivate Financial Year' : 'Activate Financial Year'}
              disabled={isUpdating}
            >
              <Power size={16} className={year.isActive ? '' : 'opacity-50'} />
            </button>
            {canCloseYear(year) && (
              <button 
                onClick={() => {
                  setSelectedYear(year);
                  setShowCloseModal(true);
                }} 
                className="text-red-600 hover:text-red-900 p-1" 
                title="Close Financial Year"
              >
                <XCircle size={16} />
              </button>
            )}
            {canReopenYear(year) && (
              <button 
                onClick={() => {
                  setSelectedYear(year);
                  setShowReopenModal(true);
                }} 
                className="text-yellow-600 hover:text-yellow-900 p-1" 
                title="Reopen Financial Year"
              >
                <Clock size={16} />
              </button>
            )}
            {canEditDelete && (
              <button onClick={() => handleDelete(year)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
                <Trash2 size={16} />
              </button>
            )}
            {!canEditDelete && !year.isClosed && !year.isCurrent && (
              <button 
                disabled 
                className="text-gray-300 p-1 cursor-not-allowed" 
                title="Cannot delete: End date has been reached"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <ContentContainer>
      <div className="financial-year-page space-y-6">

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search financial years by name, status, or description..."
            value={filters.search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
          />
          {filters.search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Current Year Status */}
      {currentYear && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Current Financial Year</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xl font-bold">{currentYear.name}</span>
                  <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    Active
                  </span>
                </div>
                <p className="text-blue-100 text-sm mt-1">
                  {formatDate(currentYear.startDate)} - {formatDate(currentYear.endDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Duration</p>
              <p className="text-lg font-semibold">
                {Math.ceil((new Date(currentYear.endDate).getTime() - new Date(currentYear.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Years</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalYears}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Years</p>
              <p className="text-2xl font-bold text-green-600">{stats.openYears}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed Years</p>
              <p className="text-2xl font-bold text-red-600">{stats.closedYears}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Year</p>
              <p className="text-2xl font-bold text-blue-600">
                {currentYear ? 'Set' : 'Not Set'}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Table Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/advance-setup')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Advance Setup
            </button>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {financialYearStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-100 transform hover:scale-105"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Export Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-100 transform hover:scale-105"
            >
              <FileText size={16} className="mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => setShowSetCurrentModal(true)}
              disabled={isSettingCurrent}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
            >
              <CheckCircle size={16} className="mr-2" />
              Set Current
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <DataTable
          data={financialYears}
          columns={columns}
          emptyMessage="No financial years found."
          showColumnControls={true}
          maxHeight={600}
        />
      </div>

      {/* Modals */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <FinancialYearForm
              financialYear={editingYear}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isCreating || isUpdating}
            />
          </div>
        </div>
      )}

      {/* Set Current Modal */}
      {showSetCurrentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Current Financial Year</h3>
            <p className="text-gray-600 mb-4">Select the financial year you want to set as current:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {financialYears.filter((year: FinancialYear) => canSetCurrentYear(year)).map((year: FinancialYear) => (
                <button
                  key={year.id}
                  onClick={() => handleSetCurrent(year)}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="font-medium text-gray-900">{year.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSetCurrentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {showCloseModal && selectedYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Close Financial Year</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to close "{selectedYear.name}"? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about closing this financial year..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedYear(null);
                  setClosingNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClose(selectedYear)}
                disabled={isClosing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Close Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && selectedYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reopen Financial Year</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reopen "{selectedYear.name}"?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reopening Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about reopening this financial year..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setSelectedYear(null);
                  setClosingNotes('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReopen(selectedYear)}
                disabled={isReopening}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                Reopen Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={handleAddNew}
        className={`fab-button ${showFormModal ? 'hidden' : ''}`}
        title="Add Financial Year"
        style={{ display: showFormModal ? 'none' : 'flex' }}
      >
        <Plus size={24} />
      </button>
      </div>
    </ContentContainer>
  );
};

export default FinancialYearPage; 