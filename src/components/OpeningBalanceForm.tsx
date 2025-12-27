import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Save } from 'lucide-react';
import { OpeningBalance, Account, Currency, FinancialYear } from '../types';
import { accountTypeNature, openingBalanceValidation } from '../data/openingBalanceModules';
import openingBalanceService from '../services/openingBalanceService';
import SearchableDropdown from './SearchableDropdown';

interface OpeningBalanceFormData {
  accountId: string;
  date: string;
  amount: number;
  type: 'debit' | 'credit';
  currencyId?: string;
  financialYearId?: string;
  description?: string;
}

interface OpeningBalanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OpeningBalanceFormData) => Promise<void>;
  openingBalance?: OpeningBalance;
  accounts: Account[];
  currencies: Currency[];
  financialYears: FinancialYear[];
  isLoading?: boolean;
  getAccountNature: (accountType: string) => 'DEBIT' | 'CREDIT';
  // Defaults for form
  defaultCurrencyId?: string;
  defaultCurrency?: Currency;
  currentFinancialYear?: FinancialYear;
}

// Form validation schema - now accepts financialYear for date validation
const createOpeningBalanceSchema = (financialYear: FinancialYear | null | undefined, financialYears: FinancialYear[]) => {
  return yup.object({
    accountId: yup
      .string()
      .required(openingBalanceValidation.accountId.required),
    date: yup
      .string()
      .required(openingBalanceValidation.date.required)
      .matches(openingBalanceValidation.date.pattern!, openingBalanceValidation.date.message)
      .test('date-within-financial-year', function(value) {
        // Get financial year from form context (parent)
        const formFinancialYearId = this.parent?.financialYearId;
        const selectedFY = financialYears.find(fy => fy.id === formFinancialYearId) || financialYear;
        
        if (!selectedFY || !value) return true; // Skip if no financial year or date
        
        const dateValue = new Date(value);
        const startDate = new Date(selectedFY.startDate);
        const endDate = new Date(selectedFY.endDate);
        
        if (dateValue < startDate || dateValue > endDate) {
          return this.createError({
            message: `Date must be between ${selectedFY.startDate} and ${selectedFY.endDate} (${selectedFY.name})`
          });
        }
        
        return true;
      }),
    amount: yup
      .number()
      .required(openingBalanceValidation.amount.required)
      .min(openingBalanceValidation.amount.min!, openingBalanceValidation.amount.message)
      .typeError('Amount must be a number'),
    type: yup
      .string()
      .required(openingBalanceValidation.type.required)
      .oneOf(openingBalanceValidation.type.enum as ('debit' | 'credit')[])
      .strict(),
    currencyId: yup
      .string()
      .optional(),
    financialYearId: yup
      .string()
      .optional(),
    description: yup
      .string()
      .optional()
      .max(openingBalanceValidation.description.maxLength!, openingBalanceValidation.description.message)
  });
};

const OpeningBalanceForm: React.FC<OpeningBalanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  openingBalance,
  accounts,
  currencies,
  financialYears,
  isLoading = false,
  getAccountNature,
  // Defaults for form
  defaultCurrencyId,
  defaultCurrency,
  currentFinancialYear
}) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [exchangeRateId, setExchangeRateId] = useState<string | null>(null);
  const [equivalentAmount, setEquivalentAmount] = useState<number>(0);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState<boolean>(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Prepare account options for searchable dropdown
  const accountOptions = useMemo(() => {
    return accounts.map(account => ({
      id: account.id,
      value: account.id,
      label: `${account.code} - ${account.name}`,
      code: account.code,
      name: account.name,
      type: account.type
    }));
  }, [accounts]);

  // Prepare currency options for searchable dropdown
  const currencyOptions = useMemo(() => {
    return currencies.map(currency => ({
      id: currency.id,
      value: currency.id,
      label: `${currency.code} - ${currency.name}`,
      code: currency.code,
      name: currency.name
    }));
  }, [currencies]);

  // Prepare financial year options for searchable dropdown
  const financialYearOptions = useMemo(() => {
    const options = financialYears.map(year => ({
      id: year.id,
      value: year.id,
      label: `${year.name} (${year.startDate} - ${year.endDate})`,
      name: year.name
    }));
    
    return options;
  }, [financialYears, currentFinancialYear]);

  // Find current financial year if not provided
  const autoCurrentFY = useMemo(() => {
    if (openingBalance?.financialYearId) return null; // Don't override if editing
    if (currentFinancialYear) return null; // Don't override if explicitly provided
    return financialYears.find(fy => fy.isCurrent && fy.isActive) || null;
  }, [openingBalance?.financialYearId, currentFinancialYear, financialYears]);

  // Get the selected financial year to determine date constraints (before useForm)
  const getSelectedFinancialYear = useMemo(() => {
    const financialYearId = openingBalance?.financialYearId || currentFinancialYear?.id || autoCurrentFY?.id;
    return financialYears.find(fy => fy.id === financialYearId) || currentFinancialYear || autoCurrentFY || null;
  }, [openingBalance?.financialYearId, currentFinancialYear, autoCurrentFY, financialYears]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm<OpeningBalanceFormData>({
    resolver: yupResolver(createOpeningBalanceSchema(getSelectedFinancialYear, financialYears)),
    defaultValues: {
      accountId: openingBalance?.accountId || '',
      date: openingBalance?.date || new Date().toISOString().split('T')[0],
      amount: openingBalance?.amount || 0,
      type: openingBalance?.type || 'debit',
      currencyId: openingBalance?.currencyId || defaultCurrencyId || '',
      financialYearId: openingBalance?.financialYearId || currentFinancialYear?.id || autoCurrentFY?.id || '',
      description: openingBalance?.description || ''
    }
  });

  const watchedAccountId = watch('accountId');
  const watchedAmount = watch('amount');
  const watchedCurrencyId = watch('currencyId');
  const watchedFinancialYearId = watch('financialYearId');
  const watchedDate = watch('date');

  // Get the selected financial year to determine date constraints (dynamic based on watch)
  const selectedFinancialYear = useMemo(() => {
    const financialYearId = watchedFinancialYearId || currentFinancialYear?.id || autoCurrentFY?.id;
    return financialYears.find(fy => fy.id === financialYearId) || currentFinancialYear || autoCurrentFY || null;
  }, [watchedFinancialYearId, currentFinancialYear, autoCurrentFY, financialYears]);

  // Get min and max dates based on financial year
  const minDate = selectedFinancialYear?.startDate || '';
  const maxDate = selectedFinancialYear?.endDate || '';

  // Update validation schema when financial year changes
  useEffect(() => {
    if (selectedFinancialYear) {
      // Trigger validation to re-check date against new financial year
      trigger('date');
    }
  }, [selectedFinancialYear, trigger]);

  // Also update the date field value if it's outside the financial year range
  useEffect(() => {
    if (selectedFinancialYear && watchedDate) {
      const dateValue = new Date(watchedDate);
      const startDate = new Date(selectedFinancialYear.startDate);
      const endDate = new Date(selectedFinancialYear.endDate);
      
      // If date is outside range, set it to start date
      if (dateValue < startDate || dateValue > endDate) {
        setValue('date', selectedFinancialYear.startDate);
      }
    }
  }, [selectedFinancialYear, watchedDate, setValue]);

  // Auto-select current financial year on form open (if not editing and not already set)
  useEffect(() => {
    if (isOpen && !openingBalance && !currentFinancialYear && autoCurrentFY && !watchedFinancialYearId) {
      setValue('financialYearId', autoCurrentFY.id);
    }
  }, [isOpen, openingBalance, currentFinancialYear, autoCurrentFY, watchedFinancialYearId, setValue]);

  // Reset form when form opens for new entry or when defaults change
  useEffect(() => {
    if (isOpen && !openingBalance) {
      // Reset form for new opening balance
      reset({
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'debit',
        currencyId: defaultCurrencyId || '',
        financialYearId: currentFinancialYear?.id || autoCurrentFY?.id || '',
        description: ''
      });
      
      // Reset local state variables
      setSelectedAccount(null);
      setSelectedCurrency(null);
      setExchangeRate(1);
      setExchangeRateId(null);
      setEquivalentAmount(0);
    } else if (isOpen && openingBalance) {
      // Set form values for editing
      reset({
        accountId: openingBalance.accountId || '',
        date: openingBalance.date || new Date().toISOString().split('T')[0],
        amount: openingBalance.amount || 0,
        type: openingBalance.type || 'debit',
        currencyId: openingBalance.currencyId || defaultCurrencyId || '',
        financialYearId: openingBalance.financialYearId || currentFinancialYear?.id || autoCurrentFY?.id || '',
        description: openingBalance.description || ''
      });
    }
  }, [isOpen, openingBalance, defaultCurrencyId, currentFinancialYear, autoCurrentFY, reset]);

  // Check for duplicate opening balance when account and financial year change
  useEffect(() => {
    const checkDuplicate = async () => {
      // Only check for new entries (not when editing)
      if (openingBalance || !watchedAccountId) {
        setDuplicateError(null);
        return;
      }

      const financialYearIdToCheck = watchedFinancialYearId || currentFinancialYear?.id || autoCurrentFY?.id;
      
      if (!financialYearIdToCheck) {
        setDuplicateError(null);
        return;
      }

      setIsCheckingDuplicate(true);
      try {
        const result = await openingBalanceService.checkOpeningBalanceExists(
          watchedAccountId,
          financialYearIdToCheck
        );

        if (result.exists && result.openingBalance) {
          const accountName = selectedAccount?.name || 'this account';
          const financialYearName = financialYears.find(fy => fy.id === financialYearIdToCheck)?.name || 'this financial year';
          setDuplicateError(`Opening balance already exists for ${accountName} in ${financialYearName}. You can only enter one opening balance per account per financial year.`);
        } else {
          setDuplicateError(null);
        }
      } catch (error) {
        // Don't show error for check failures, just log
        setDuplicateError(null);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    checkDuplicate();
  }, [watchedAccountId, watchedFinancialYearId, currentFinancialYear?.id, autoCurrentFY?.id, openingBalance, selectedAccount, financialYears]);

  // Update account nature when account changes
  useEffect(() => {
    if (watchedAccountId) {
      const account = accounts.find(acc => acc.id === watchedAccountId);
      if (account) {
        setSelectedAccount(account);
        const nature = getAccountNature(account.type);
        setValue('type', nature.toLowerCase() as 'debit' | 'credit');
      }
    } else {
      setSelectedAccount(null);
    }
  }, [watchedAccountId, accounts, getAccountNature, setValue]);

  // Update currency and exchange rate when currency changes
  useEffect(() => {
    const updateCurrencyAndRate = async () => {
      if (watchedCurrencyId) {
        const currency = currencies.find(curr => curr.id === watchedCurrencyId);
        
        if (currency) {
          setSelectedCurrency(currency);
          
          const defaultCurrency = currencies.find(c => c.is_default);

          // Get latest exchange rate
          if (currency && defaultCurrency && currency.id !== defaultCurrency.id) {
            setIsLoadingExchangeRate(true);
            try {
              const rateData = await openingBalanceService.getLatestExchangeRate(currency.id);
              
              // Ensure we have a valid rate
              if (rateData && typeof rateData.rate === 'number' && rateData.rate > 0) {
                setExchangeRate(rateData.rate);
                setExchangeRateId(rateData.id);
              } else {
                setExchangeRate(1);
                setExchangeRateId(null);
              }
            } catch (error) {
              setExchangeRate(1);
              setExchangeRateId(null);
            } finally {
              setIsLoadingExchangeRate(false);
            }
                      } else {
              setExchangeRate(1);
              setExchangeRateId(null);
            }
        }
      } else {
        setSelectedCurrency(null);
        setExchangeRate(1);
        setExchangeRateId(null);
      }
    };

    updateCurrencyAndRate();
  }, [watchedCurrencyId, currencies]);

  // Calculate equivalent amount when amount or exchange rate changes
  useEffect(() => {
    if (watchedAmount && exchangeRate) {
      const equivalent = openingBalanceService.calculateEquivalentAmount(watchedAmount, exchangeRate);
      setEquivalentAmount(equivalent);
    } else {
      setEquivalentAmount(0);
    }
  }, [watchedAmount, exchangeRate]);

  // Handle form submission
  const handleFormSubmit = async (data: OpeningBalanceFormData) => {
    try {
      // Check for duplicate before submission (for new entries only)
      if (!openingBalance) {
        const financialYearIdToCheck = data.financialYearId || currentFinancialYear?.id || autoCurrentFY?.id;
        
        if (data.accountId && financialYearIdToCheck) {
          const result = await openingBalanceService.checkOpeningBalanceExists(
            data.accountId,
            financialYearIdToCheck
          );

          if (result.exists) {
            const accountName = selectedAccount?.name || 'this account';
            const financialYearName = financialYears.find(fy => fy.id === financialYearIdToCheck)?.name || 'this financial year';
            setDuplicateError(`Opening balance already exists for ${accountName} in ${financialYearName}. You can only enter one opening balance per account per financial year.`);
            return; // Prevent submission
          }
        }
      }

      // Add exchange rate and equivalent amount to the data
      // Reference number will be generated automatically by the backend
      const formData = {
        ...data,
        exchangeRate: exchangeRate,
        exchangeRateId: exchangeRateId,
        equivalentAmount: equivalentAmount,
        originalAmount: selectedCurrency && selectedCurrency.id !== currencies.find(c => c.is_default)?.id 
          ? data.amount 
          : undefined
      };

      await onSubmit(formData);
      
      // Reset form after successful submission (only for new entries)
      if (!openingBalance) {
        reset({
          accountId: '',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          type: 'debit',
          currencyId: defaultCurrencyId || '',
          financialYearId: currentFinancialYear?.id || autoCurrentFY?.id || '',
          description: ''
        });
        
        // Reset local state variables
        setSelectedAccount(null);
        setSelectedCurrency(null);
        setExchangeRate(1);
        setExchangeRateId(null);
        setEquivalentAmount(0);
        setDuplicateError(null);
      }
    } catch (error) {
      // Error handling is done in parent component
      // If it's a duplicate error from backend, show it
      if ((error as any)?.response?.data?.error?.includes('already exists')) {
        setDuplicateError((error as any).response.data.error);
      }
    }
  };

  // Format currency display
  const formatCurrency = (amount: number, currencyCode: string = 'TZS', currencySymbol?: string) => {
    return openingBalanceService.formatAmount(amount, currencyCode, currencySymbol);
  };

  // Handle amount input formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      const formattedValue = parts[0] + '.' + parts.slice(1).join('');
      setValue('amount', parseFloat(formattedValue) || 0);
    } else {
      setValue('amount', parseFloat(cleanValue) || 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {openingBalance ? 'Edit Opening Balance' : 'Add Opening Balance'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
      {/* Account and Date Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
            Account *
          </label>
          <SearchableDropdown
            options={accountOptions}
            value={watch('accountId')}
            onChange={(value) => setValue('accountId', value)}
            placeholder="Select Account"
            searchPlaceholder="Search by code, name, or type..."
            disabled={isLoading}
            error={!!errors.accountId}
            maxHeight="300px"
          />
          {errors.accountId && (
            <p className="mt-1 text-sm text-red-600">{errors.accountId.message}</p>
          )}
          {isCheckingDuplicate && (
            <p className="mt-1 text-sm text-blue-600">Checking for existing opening balance...</p>
          )}
          {duplicateError && (
            <p className="mt-1 text-sm text-red-600 font-semibold">{duplicateError}</p>
          )}
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
            {selectedFinancialYear && (
              <span className="text-xs text-gray-500 ml-2">
                ({selectedFinancialYear.startDate} - {selectedFinancialYear.endDate})
              </span>
            )}
          </label>
          <input
            type="date"
            id="date"
            {...register('date')}
            min={minDate}
            max={maxDate}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
          {selectedFinancialYear && !errors.date && (
            <p className="mt-1 text-xs text-gray-500">
              Date must be within {selectedFinancialYear.name}
            </p>
          )}
        </div>
      </div>

      {/* Amount and Nature Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="text"
            id="amount"
            {...register('amount')}
            onChange={handleAmountChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            disabled={isLoading}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Nature *
          </label>
          <input
            type="text"
            id="type"
            {...register('type')}
            className={`w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
            readOnly
            disabled={isLoading}
          />
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      {/* Currency and Financial Year Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <SearchableDropdown
            options={currencyOptions}
            value={watch('currencyId') || ''}
            onChange={(value) => setValue('currencyId', value)}
            placeholder="Select Currency"
            searchPlaceholder="Search by code or name..."
            disabled={isLoading}
            error={!!errors.currencyId}
            maxHeight="200px"
          />
          {errors.currencyId && (
            <p className="mt-1 text-sm text-red-600">{errors.currencyId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="financialYearId" className="block text-sm font-medium text-gray-700 mb-1">
            Financial Year
          </label>
          <SearchableDropdown
            options={financialYearOptions}
            value={watch('financialYearId') || ''}
            onChange={(value) => setValue('financialYearId', value)}
            placeholder="Select Financial Year"
            searchPlaceholder="Search by name or date..."
            disabled={isLoading || !!currentFinancialYear}
            error={!!errors.financialYearId}
            maxHeight="200px"
          />
          {errors.financialYearId && (
            <p className="mt-1 text-sm text-red-600">{errors.financialYearId.message}</p>
          )}
        </div>
      </div>

      {/* Exchange Rate and Equivalent Amount Section */}
      {selectedCurrency && selectedCurrency.code !== (currencies.find(c => c.is_default)?.code || 'TZS') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate (to Default Currency)
            </label>
            <input
              type="text"
              id="exchangeRate"
              value={isLoadingExchangeRate ? 'Loading...' : exchangeRate.toFixed(6)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed font-mono"
              readOnly
              disabled={isLoading}
            />

            <p className="mt-1 text-xs text-gray-500">
              Shows conversion rate to default currency. Auto-calculated when currency is selected.
            </p>
          </div>

          <div>
            <label htmlFor="equivalentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Equivalent Amount (in Default Currency)
            </label>
            <div
              id="equivalentAmount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-800 font-bold font-mono"
            >
              {formatCurrency(equivalentAmount, currencies.find(c => c.is_default)?.code || 'TZS', currencies.find(c => c.is_default)?.symbol)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This is automatically calculated: Amount × Exchange Rate = Equivalent Amount
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter description (optional)"
          disabled={isLoading}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <X size={16} className="inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !!duplicateError || isCheckingDuplicate}
            >
              <Save size={16} className="inline mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default OpeningBalanceForm; 