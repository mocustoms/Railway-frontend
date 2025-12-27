import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Tags, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  FileText, 
  FileSpreadsheet, 
  Search,
  X,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { usePriceCategoryManagement } from '../hooks/usePriceCategoryManagement';
import { PriceCategory } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PriceCategoryForm from '../components/PriceCategoryForm';
import PriceCategoryView from '../components/PriceCategoryView';
import ConfirmDialog from '../components/ConfirmDialog';
import ContentContainer from '../components/ContentContainer';
import { formatDate } from '../utils/formatters';

const PriceCategories: React.FC = () => {
  const navigate = useNavigate();
  const {
    // State
    searchTerm,
    selectedStatus,
    selectedChangeType,
    selectedScheduledType,
    currentPage,
    pageSize,
    priceCategories,
    totalItems,
    totalPages,
    stats,
    isLoadingPriceCategories,
    isLoadingStats,
    statsError,

    // Loading states - Following established standards
    isCreating,
    isUpdating,
    isDeleting,
    isDeactivating,
    isCheckingUsage,
    isExportingExcel,
    isExportingPdf,

    // Permissions - Following established standards
    canCreate,
    canEdit,
    canDelete,
    canExport,

    // Direct CRUD functions - Following established standards
    createPriceCategory,
    updatePriceCategory,
    deletePriceCategory,
    handleDeactivate,
    handleCheckUsage,

    // Mutations - Following established standards
    createMutation,
    updateMutation,
    deleteMutation,
    deactivateMutation,
    checkUsageMutation,
    exportExcelMutation,
    exportPdfMutation,

    // Event handlers - Following established standards
    setSearchTerm,
    setSelectedStatus,
    setSelectedChangeType,
    setSelectedScheduledType,
    handlePageChange,
    handlePageSizeChange,
    handleExportExcel,
    handleExportPdf
  } = usePriceCategoryManagement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PriceCategory | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [usageData, setUsageData] = useState<{
    isUsed: boolean;
    usageCount: number;
    message: string;
  } | null>(null);

  // Computed values
  const showingStart = useMemo(() => {
    if (totalItems === 0) return 0;
    return (currentPage - 1) * pageSize + 1;
  }, [currentPage, pageSize, totalItems]);
  
  const showingEnd = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.min(currentPage * pageSize, totalItems);
  }, [currentPage, pageSize, totalItems]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: PriceCategory) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleView = (category: PriceCategory) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleViewModalClose = () => {
    setIsViewModalOpen(false);
    setSelectedCategory(null);
  };

  const openDeleteModal = async (category: PriceCategory) => {
    try {
      const usage = await handleCheckUsage(category.id);
      setUsageData(usage);
      setSelectedCategory(category);
      setIsDeleteModalOpen(true);
    } catch (error) {
      }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    try {
      if (usageData?.isUsed) {
        await handleDeactivate(selectedCategory.id);
      } else {
        await deletePriceCategory(selectedCategory.id);
      }
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
      setUsageData(null);
    } catch (error) {
      // Error is already handled by the mutation with toast notifications
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await createPriceCategory(data);
      } else if (selectedCategory) {
        await updatePriceCategory(selectedCategory.id, data);
      }
      handleModalClose();
    } catch (error) {
      // Error is already handled by the mutation with toast notifications
    }
  };

  // Table columns configuration for DataTable
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Category Name',
      render: (category: PriceCategory) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tags className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <span className="font-medium text-gray-900">{category.name}</span>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'code',
      header: 'Category Code',
      render: (category: PriceCategory) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {category.code}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'description',
      header: 'Description',
      render: (category: PriceCategory) => (
        <span className="text-gray-600">
          {category.description || '-'}
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'price_change_type',
      header: 'Change Type',
      render: (category: PriceCategory) => (
        <div className="flex items-center gap-2">
          {category.price_change_type === 'increase' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm font-medium capitalize">
            {category.price_change_type}
          </span>
        </div>
      ),
      defaultVisible: true
    },
    {
      key: 'percentage_change',
      header: 'Percentage Change',
      render: (category: PriceCategory) => (
        <span className={`font-medium ${
          category.price_change_type === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {category.percentage_change}%
        </span>
      ),
      defaultVisible: true
    },
    {
      key: 'scheduled_type',
      header: 'Scheduled Type',
      render: (category: PriceCategory) => (
        <span className="capitalize">
          {category.scheduled_type === 'not_scheduled' ? 'Not Scheduled' : 
           category.scheduled_type === 'one_time' ? 'One Time' : 
           category.scheduled_type === 'recurring' ? 'Recurring' : 
           category.scheduled_type}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'recurring_details',
      header: 'Recurring Details',
      render: (category: PriceCategory) => {
        if (category.scheduled_type !== 'recurring' || !category.recurring_period) {
          return <span className="text-gray-400">-</span>;
        }

        const getRecurringText = () => {
          switch (category.recurring_period) {
            case 'daily':
              return `Daily ${category.start_time || ''} - ${category.end_time || ''}`;
            case 'weekly':
              const dayOfWeek = category.recurring_day_of_week || '';
              return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${category.start_time || ''} - ${category.end_time || ''}`;
            case 'monthly':
              return `${category.recurring_date || ''}th ${category.start_time || ''} - ${category.end_time || ''}`;
            case 'yearly':
              const month = category.recurring_month || '';
              return `${month.charAt(0).toUpperCase() + month.slice(1)} ${category.recurring_date || ''}th ${category.start_time || ''} - ${category.end_time || ''}`;
            default:
              return '-';
          }
        };

        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {category.recurring_period.charAt(0).toUpperCase() + category.recurring_period.slice(1)}
            </div>
            <div className="text-gray-600 text-xs">
              {getRecurringText()}
            </div>
          </div>
        );
      },
      defaultVisible: false
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (category: PriceCategory) => (
        <StatusBadge 
          status={category.is_active ? 'active' : 'inactive'}
          variant={category.is_active ? 'success' : 'error'}
        />
      ),
      defaultVisible: true
    },
    {
      key: 'created_by_name',
      header: 'Created By',
      render: (category: PriceCategory) => (
        <span className="text-gray-600">
          {category.created_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (category: PriceCategory) => (
        <span className="text-gray-600">
          {formatDate(category.created_at || category.createdAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_by_name',
      header: 'Updated By',
      render: (category: PriceCategory) => (
        <span className="text-gray-600">
          {category.updated_by_name || '-'}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'updated_at',
      header: 'Updated Date',
      render: (category: PriceCategory) => (
        <span className="text-gray-600">
          {formatDate(category.updated_at || category.updatedAt)}
        </span>
      ),
      defaultVisible: false
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category: PriceCategory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(category)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteModal(category)}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
      defaultVisible: true
    }
  ], [canEdit, canDelete]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={0}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats?.totalCategories || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <Tags className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={1}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Increase Categories</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoadingStats ? '...' : stats?.increaseCategories || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={2}>
                        <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Decrease Categories</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoadingStats ? '...' : stats?.decreaseCategories || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0 ml-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="animate-slideInUp hover:shadow-md transition-all duration-150 min-w-0 flex-1" animationDelay={3}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Upcoming Schedules</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoadingStats ? '...' : stats?.upcomingScheduledCategories || 0}
                </p>
                {statsError && (
                  <p className="text-xs text-red-500 mt-1">Error loading stats</p>
                )}
              </div>
              <div className="p-2 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Table Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-slideInUp hover:shadow-md transition-all duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/products')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Products
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {canExport && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

      {/* Enhanced Product Categories Table Container */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
        {isLoadingPriceCategories ? (
          <div className="flex items-center justify-center py-12 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading price categories...</span>
          </div>
        ) : (
          <>
              <DataTable
                data={priceCategories}
                columns={columns}
                emptyMessage="No price categories found matching your criteria."
                showColumnControls={true}
                maxHeight={600}
              />

            {/* Pagination Controls */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 animate-fadeIn">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="pageSizeSelect" className="text-sm text-gray-700">Show</label>
                  <select
                    id="pageSizeSelect"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-100"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-700">items</span>
                </div>
                <span className="text-sm text-gray-700">
                  Showing {showingStart}-{showingEnd} of {totalItems}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-100 transform hover:scale-105 ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalMode === 'create' ? 'Add Price Category' : 'Edit Price Category'}
        size="lg"
      >
        <PriceCategoryForm
          category={selectedCategory}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          isLoading={isCreating || isUpdating}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        title="View Price Category"
        size="lg"
      >
        {selectedCategory && (
          <PriceCategoryView
            category={selectedCategory}
            onClose={handleViewModalClose}
            onEdit={() => {
              handleViewModalClose();
              handleEdit(selectedCategory);
            }}
            canEdit={canEdit}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Price Category"
          message={
            usageData?.isUsed
              ? `This price category is used by ${usageData.usageCount} product(s). Would you like to deactivate it instead?`
              : `Are you sure you want to delete the price category "${selectedCategory?.name}"? This action cannot be undone.`
          }
          confirmText={usageData?.isUsed ? "Deactivate" : "Delete"}
          cancelText="Cancel"
          variant={usageData?.isUsed ? "warning" : "danger"}
          isLoading={isDeleting || isDeactivating}
        />

      {/* Floating Action Button */}
      {canCreate && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-110 z-50"
          title="Add Price Category"
        >
          <Plus className="w-6 h-6 mx-auto" />
        </button>
      )}
    </ContentContainer>
  </div>
);
};

export default PriceCategories;
