import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Company, Currency, CostingMethod } from '../types';
import { defaultCostingMethods } from '../data/companySetupModules';
import toast from 'react-hot-toast';
import api from '../services/api';

interface UseCompanySetupManagementReturn {
  // State
  company: Company | null;
  currencies: Currency[];
  costingMethods: CostingMethod[];
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  
  // Actions
  saveCompany: (data: Partial<Company>, logoFile?: File) => Promise<Company | null>;
  uploadLogo: (file: File) => Promise<string | null>;
  deleteLogo: () => Promise<boolean>;
  
  // Computed
  hasCompany: boolean;
  canEdit: boolean;
  
  // Utilities
  validateCompanyData: (data: Partial<Company>) => { isValid: boolean; errors: string[] };
  formatCompanyData: (data: Partial<Company>) => Partial<Company>;
}

export const useCompanySetupManagement = (): UseCompanySetupManagementReturn => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  // Queries
  const {
    data: company,
    isLoading: isLoadingCompany,
  } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: async () => {
      const response = await api.get('/company');
      return response.data.success ? response.data.data : null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  const {
    data: currencies,
    isLoading: isLoadingCurrencies,
  } = useQuery({
    queryKey: ['currencies', 'all'],
    queryFn: async () => {
      const response = await api.get('/currency?limit=100');
      return response.data.currencies || response.data.data?.currencies || [];
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  const {
    data: costingMethods,
    isLoading: isLoadingCostingMethods,
  } = useQuery({
    queryKey: ['costingMethods'],
    queryFn: async () => {
      try {
        const response = await api.get('/price-history/costing-methods');
        return response.data.success && response.data.data ? response.data.data : defaultCostingMethods;
      } catch (error) {
        toast('Using default costing methods');
        return defaultCostingMethods as CostingMethod[];
      }
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

  // Mutations
  const saveCompanyMutation = useMutation({
    mutationFn: async ({ data, logoFile }: { data: Partial<Company>; logoFile?: File }) => {
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add logo file if provided
      if (logoFile) {
        formData.append('logoFile', logoFile);
      } else if (data.logo) {
        // If no new file but existing logo URL, pass the URL
        formData.append('logo', data.logo);
      }

      const response = await api.post('/company', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.success ? response.data.data : null;
    },
    onSuccess: (savedCompany) => {
      if (savedCompany) {
        queryClient.setQueryData(['company'], savedCompany);
        toast.success('Company details saved successfully!');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to save company details';
      toast.error(errorMessage);
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logoFile', file);

      const response = await api.post('/company/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.success ? response.data.data.logoUrl : null;
    },
    onSuccess: (logoUrl) => {
      if (logoUrl) {
        toast.success('Logo uploaded successfully!');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to upload logo';
      toast.error(errorMessage);
    }
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/company/logo');
      return response.data.success;
    },
    onSuccess: (success) => {
      if (success) {
        // Update company data to remove logo
        queryClient.setQueryData(['company'], (oldData: Company | null) => {
          if (oldData) {
            return { ...oldData, logo: undefined };
          }
          return oldData;
        });
        toast.success('Logo deleted successfully!');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete logo';
      toast.error(errorMessage);
    }
  });

  // Computed values
  const hasCompany = useMemo(() => company !== null, [company]);
  const canEdit = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Combined loading state
  const isLoading = isLoadingCompany || isLoadingCurrencies || isLoadingCostingMethods;
  const isSaving = saveCompanyMutation.isPending;
  const isUploading = uploadLogoMutation.isPending;

  // Actions
  const saveCompany = useCallback(async (data: Partial<Company>, logoFile?: File): Promise<Company | null> => {
    if (!isAuthenticated) return null;
    return await saveCompanyMutation.mutateAsync({ data, logoFile });
  }, [isAuthenticated, saveCompanyMutation]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!isAuthenticated) return null;
    return await uploadLogoMutation.mutateAsync(file);
  }, [isAuthenticated, uploadLogoMutation]);

  const deleteLogo = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    return await deleteLogoMutation.mutateAsync();
  }, [isAuthenticated, deleteLogoMutation]);

  // Utility functions
  const validateCompanyData = useCallback((data: Partial<Company>) => {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
      errors.push('Company name is required');
    }
    
    // Code is now auto-generated by backend, no validation needed
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    if (!data.phone?.trim()) {
      errors.push('Phone number is required');
    }
    
    if (!data.address?.trim()) {
      errors.push('Address is required');
    }

    // Validate default currency connection
    if (data.defaultCurrencyId && currencies) {
      const currencyExists = currencies.find((c: Currency) => c.id === data.defaultCurrencyId);
      if (!currencyExists) {
        errors.push('Selected default currency is not valid');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [currencies]);

  const formatCompanyData = useCallback((data: Partial<Company>) => {
    return {
      ...data,
      name: data.name?.trim(),
      // Code is auto-generated by backend, don't include it in form data
      email: data.email?.trim(),
      phone: data.phone?.trim(),
      address: data.address?.trim(),
      website: data.website?.trim() || undefined,
      description: data.description?.trim() || undefined
    };
  }, []);

  return {
    // State
    company: company || null,
    currencies: currencies || [],
    costingMethods: costingMethods || [],
    isLoading,
    isSaving,
    isUploading,
    
    // Actions
    saveCompany,
    uploadLogo,
    deleteLogo,
    
    // Computed
    hasCompany,
    canEdit,
    
    // Utilities
    validateCompanyData,
    formatCompanyData
  };
}; 