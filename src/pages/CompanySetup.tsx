import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { useCompanySetupManagement } from '../hooks/useCompanySetupManagement';
import CompanySetupForm from '../components/CompanySetupForm';

const CompanySetup: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const {
    company,
    currencies,
    costingMethods,
    isLoading,
    isSaving,
    isUploading,
    saveCompany,
    hasCompany,
    canEdit
  } = useCompanySetupManagement();

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any, logoFile?: File) => {
    try {
      const savedCompany = await saveCompany(data, logoFile);
      if (savedCompany) {
        setShowForm(false);
      }
    } catch (error) {
      // Error is already handled by the hook
    }
  }, [saveCompany]);

  // Handle form cancellation
  const handleFormCancel = useCallback(() => {
    setShowForm(false);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback(() => {
    setShowForm(true);
  }, []);

  // Handle back navigation
  const handleBackClick = useCallback(() => {
    navigate('/advance-setup');
  }, [navigate]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircle size={12} className="mr-1" />
            Active
          </>
        ) : (
          <>
            <AlertCircle size={12} className="mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Advance Setup
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {showForm ? (
            // Form View
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {hasCompany ? 'Edit Company Details' : 'Setup Company Details'}
                </h2>
                <p className="text-gray-600">
                  {hasCompany 
                    ? 'Update your company information and settings'
                    : 'Configure your company details to get started'
                  }
                </p>
              </div>
              <CompanySetupForm
                company={company}
                currencies={currencies}
                costingMethods={costingMethods}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                isLoading={isLoading}
                isSaving={isSaving}
                isUploading={isUploading}
              />
            </div>
          ) : (
            // Display View
            <div className="space-y-6">
              {hasCompany ? (
                // Company Details Display
                <div className="space-y-6">
                  {/* Company Header */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        {company?.logo ? (
                          <>
                            <img 
                              src={`http://localhost:3000${company.logo}`}
                              alt={`${company.name} Logo`} 
                              className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center hidden">
                              <Building size={32} className="text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                            <Building size={32} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{company?.name}</h2>
                        <p className="text-gray-600 mb-2">Code: {company?.code}</p>
                        {getStatusBadge(company?.isActive || false)}
                      </div>
                      {canEdit && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={handleEditClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
                          >
                            <Edit size={16} className="mr-2" />
                            Edit Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Company Details Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
                      <div className="flex items-center mb-4">
                        <Building size={20} className="text-blue-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Company Details</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <span className="text-sm text-gray-900 text-right">{company?.email}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <span className="text-sm text-gray-900 text-right">{company?.phone}</span>
                        </div>
                        {company?.website && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Website:</span>
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 text-right"
                            >
                              {company.website}
                            </a>
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Address:</span>
                          <span className="text-sm text-gray-900 text-right">{company?.address}</span>
                        </div>
                        {company?.country && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Country:</span>
                            <span className="text-sm text-gray-900 text-right">{company?.country}</span>
                          </div>
                        )}
                        {company?.region && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Region:</span>
                            <span className="text-sm text-gray-900 text-right">{company?.region}</span>
                          </div>
                        )}
                        {company?.description && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Description:</span>
                            <span className="text-sm text-gray-900 text-right">{company?.description}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Business Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
                      <div className="flex items-center mb-4">
                        <Building size={20} className="text-green-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Business Information</h4>
                      </div>
                      <div className="space-y-3">
                        {company?.businessType && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Business Type:</span>
                            <span className="text-sm text-gray-900 text-right">{company.businessType}</span>
                          </div>
                        )}
                        {company?.industry && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Industry:</span>
                            <span className="text-sm text-gray-900 text-right">{company.industry}</span>
                          </div>
                        )}
                        {company?.businessRegistrationNumber && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Registration No.:</span>
                            <span className="text-sm text-gray-900 text-right">{company.businessRegistrationNumber}</span>
                          </div>
                        )}
                        {company?.timezone && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Timezone:</span>
                            <span className="text-sm text-gray-900 text-right">{company.timezone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax & Legal Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
                      <div className="flex items-center mb-4">
                        <Building size={20} className="text-purple-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Tax & Legal Information</h4>
                      </div>
                      <div className="space-y-3">
                        {company?.tin && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">TIN No.:</span>
                            <span className="text-sm text-gray-900 text-right">{company.tin}</span>
                          </div>
                        )}
                        {company?.vrn && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">VRN:</span>
                            <span className="text-sm text-gray-900 text-right">{company.vrn}</span>
                          </div>
                        )}
                        {company?.fax && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">Fax:</span>
                            <span className="text-sm text-gray-900 text-right">{company.fax}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Settings Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150">
                      <div className="flex items-center mb-4">
                        <Building size={20} className="text-orange-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Financial Settings</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Default Currency:</span>
                          <span className="text-sm text-gray-900 text-right">
                            {company?.defaultCurrency?.code} - {company?.defaultCurrency?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Costing Method:</span>
                          <span className="text-sm text-gray-900 text-right">
                            {company?.costingMethodDetails?.name} ({company?.costingMethodDetails?.code})
                          </span>
                        </div>
                        {company?.efdSettings && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-600">EFD Settings:</span>
                            <span className="text-sm text-gray-900 text-right">{company.efdSettings}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* System Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <Building size={20} className="text-gray-600 mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">System Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Created:</span>
                          <span className="text-sm text-gray-900">{formatDate(company?.createdAt || '')}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                          <span className="text-sm text-gray-900">{formatDate(company?.updatedAt || '')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // No Company Setup
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 animate-slideInUp hover:shadow-md transition-all duration-150">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                      <Building size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Company Setup Found</h3>
                    <p className="text-gray-600 mb-6">You need to configure your company details to get started with the system.</p>
                    <button 
                      onClick={handleEditClick}
                      disabled={!canEdit}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 transform hover:scale-105"
                    >
                      <Building size={16} className="mr-2" />
                      Setup Company
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySetup; 