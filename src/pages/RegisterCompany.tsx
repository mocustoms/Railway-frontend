import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Building2, MapPin, Phone, Mail, Globe, FileText, Briefcase, Factory, Globe as GlobeIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const companySchema = yup.object({
  companyName: yup.string().required('Company name is required').min(2, 'Company name must be at least 2 characters'),
  companyAddress: yup.string().required('Company address is required').min(5, 'Please provide a complete address'),
  companyPhone: yup.string().required('Company phone is required').min(10, 'Please provide a valid phone number'),
  companyEmail: yup.string().required('Company email is required').email('Please provide a valid email address'),
  companyWebsite: yup.string().url('Please provide a valid website URL').optional(),
  companyTin: yup.string().optional(),
  companyVrn: yup.string().optional(),
  companyBusinessRegistrationNumber: yup.string().optional(),
  companyBusinessType: yup.string().optional(),
  companyIndustry: yup.string().optional(),
  companyCountry: yup.string().optional(),
  companyRegion: yup.string().optional(),
  companyTimezone: yup.string().optional(),
});

interface CompanyFormData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  companyTin?: string;
  companyVrn?: string;
  companyBusinessRegistrationNumber?: string;
  companyBusinessType?: string;
  companyIndustry?: string;
  companyCountry?: string;
  companyRegion?: string;
  companyTimezone?: string;
}

const RegisterCompany: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please create an account first');
      navigate('/register');
    } else if (user?.companyId) {
      // User already has a company, redirect to app main
      toast('You already have a company registered', { icon: 'ℹ️' });
      navigate('/app-main');
    }
  }, [isAuthenticated, user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormData>({
    resolver: yupResolver(companySchema),
    defaultValues: {
      companyCountry: 'Tanzania',
      companyTimezone: 'Africa/Dar_es_Salaam'
    }
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsLoading(true);
      
      const response = await authService.registerCompany(data);
      
      if (response && response.company) {
        // Show success message about auto-initialization if applicable
        if (response.autoInitialized?.account_types && response.autoInitialized?.accounts) {
          toast.success('Company registered successfully! Account Types and Accounts initialized automatically.', {
            duration: 4000
          });
        } else {
          toast.success('Company registered successfully!', {
            duration: 3000
          });
        }
        
        // Give a small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Always redirect to app main after successful company registration
        // Force a page reload to refresh all context state
        window.location.href = '/app-main';
      } else {
        throw new Error('Company registration failed');
      }
    } catch (error: any) {
      let errorMessage = 'Company registration failed. Please try again.';
      if (error.message) {
        switch (error.message.toLowerCase()) {
          case 'company name, address, phone, and email are required':
            errorMessage = 'Please fill in all required company fields.';
            break;
          case 'user already has a company registered':
            errorMessage = 'You already have a company registered.';
            navigate('/app-main');
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user already has a company, they shouldn't be here (will redirect in useEffect)
  if (user?.companyId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gray-100">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex min-h-[700px]">
          {/* Left Panel - Company Registration Form */}
          <div className="flex-1 bg-white p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Register Your Company</h1>
                    <p className="text-gray-600 text-sm mt-1">Step 2 of 2</p>
                  </div>
                </div>
                <p className="text-gray-600 text-lg mt-2">
                  Complete your registration by adding your company details.
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center">
                  <div className="flex-1 h-2 bg-green-500 rounded"></div>
                  <div className="mx-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    ✓
                  </div>
                  <div className="flex-1 h-2 bg-blue-500 rounded"></div>
                  <div className="mx-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    2
                  </div>
                  <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>Account</span>
                  <span>Company</span>
                  <span>Complete</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium text-gray-700 flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Company Name *
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    placeholder="Enter company name"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.companyName ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm">{errors.companyName.message}</p>
                  )}
                </div>

                {/* Company Address */}
                <div className="space-y-2">
                  <label htmlFor="companyAddress" className="text-sm font-medium text-gray-700 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Company Address *
                  </label>
                  <textarea
                    {...register('companyAddress')}
                    id="companyAddress"
                    placeholder="Enter company address"
                    disabled={isLoading}
                    rows={3}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.companyAddress ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.companyAddress && (
                    <p className="text-red-500 text-sm">{errors.companyAddress.message}</p>
                  )}
                </div>

                {/* Company Phone */}
                <div className="space-y-2">
                  <label htmlFor="companyPhone" className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Company Phone *
                  </label>
                  <input
                    {...register('companyPhone')}
                    type="tel"
                    id="companyPhone"
                    placeholder="Enter company phone number"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.companyPhone ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.companyPhone && (
                    <p className="text-red-500 text-sm">{errors.companyPhone.message}</p>
                  )}
                </div>

                {/* Company Email */}
                <div className="space-y-2">
                  <label htmlFor="companyEmail" className="text-sm font-medium text-gray-700 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Company Email *
                  </label>
                  <input
                    {...register('companyEmail')}
                    type="email"
                    id="companyEmail"
                    placeholder="Enter company email address"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.companyEmail ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.companyEmail && (
                    <p className="text-red-500 text-sm">{errors.companyEmail.message}</p>
                  )}
                </div>

                {/* Company Website */}
                <div className="space-y-2">
                  <label htmlFor="companyWebsite" className="text-sm font-medium text-gray-700 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Company Website
                  </label>
                  <input
                    {...register('companyWebsite')}
                    type="url"
                    id="companyWebsite"
                    placeholder="https://www.example.com"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      errors.companyWebsite ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.companyWebsite && (
                    <p className="text-red-500 text-sm">{errors.companyWebsite.message}</p>
                  )}
                </div>

                {/* Two Column Layout for Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* TIN */}
                  <div className="space-y-2">
                    <label htmlFor="companyTin" className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      TIN
                    </label>
                    <input
                      {...register('companyTin')}
                      type="text"
                      id="companyTin"
                      placeholder="Tax ID"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* VRN */}
                  <div className="space-y-2">
                    <label htmlFor="companyVrn" className="text-sm font-medium text-gray-700 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      VRN
                    </label>
                    <input
                      {...register('companyVrn')}
                      type="text"
                      id="companyVrn"
                      placeholder="VAT Registration"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Business Registration Number */}
                <div className="space-y-2">
                  <label htmlFor="companyBusinessRegistrationNumber" className="text-sm font-medium text-gray-700 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Business Registration Number
                  </label>
                  <input
                    {...register('companyBusinessRegistrationNumber')}
                    type="text"
                    id="companyBusinessRegistrationNumber"
                    placeholder="Business registration number"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Business Type */}
                  <div className="space-y-2">
                    <label htmlFor="companyBusinessType" className="text-sm font-medium text-gray-700 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Business Type
                    </label>
                    <input
                      {...register('companyBusinessType')}
                      type="text"
                      id="companyBusinessType"
                      placeholder="e.g., Retail, Service"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Industry */}
                  <div className="space-y-2">
                    <label htmlFor="companyIndustry" className="text-sm font-medium text-gray-700 flex items-center">
                      <Factory className="w-4 h-4 mr-2" />
                      Industry
                    </label>
                    <input
                      {...register('companyIndustry')}
                      type="text"
                      id="companyIndustry"
                      placeholder="Industry sector"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Country */}
                  <div className="space-y-2">
                    <label htmlFor="companyCountry" className="text-sm font-medium text-gray-700 flex items-center">
                      <GlobeIcon className="w-4 h-4 mr-2" />
                      Country
                    </label>
                    <input
                      {...register('companyCountry')}
                      type="text"
                      id="companyCountry"
                      placeholder="Country"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-2">
                    <label htmlFor="companyRegion" className="text-sm font-medium text-gray-700 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Region
                    </label>
                    <input
                      {...register('companyRegion')}
                      type="text"
                      id="companyRegion"
                      placeholder="Region/State"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label htmlFor="companyTimezone" className="text-sm font-medium text-gray-700 flex items-center">
                    <GlobeIcon className="w-4 h-4 mr-2" />
                    Timezone
                  </label>
                  <input
                    {...register('companyTimezone')}
                    type="text"
                    id="companyTimezone"
                    placeholder="e.g., Africa/Dar_es_Salaam"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base transition-all duration-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registering Company...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>

                {/* Back Links */}
                <div className="text-center pt-4 text-sm text-gray-600 space-y-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
                    >
                      ← Back to Account Registration
                    </button>
                  </div>
                  <div>
                    <span className="text-gray-500">or </span>
                    <Link
                      to="/login"
                      className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors duration-200"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Image Background */}
          <div className="flex-1 relative overflow-hidden">
            <img 
              src={`${process.env.PUBLIC_URL || ''}/creating_an_account.png`}
              alt="Company registration"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to direct path if PUBLIC_URL doesn't work
                if (e.currentTarget.src !== '/creating_an_account.png') {
                  e.currentTarget.src = '/creating_an_account.png';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;

