import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { X, Save, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Account, Currency, FinancialYear, Company } from '../types';
import { JournalEntry, JournalEntryFormData, JournalEntryLineFormData } from '../services/journalEntryService';
import SearchableDropdown from './SearchableDropdown';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import { useSidebar } from '../contexts/SidebarContext';

interface JournalEntryFormProps {
  isOpen?: boolean;
  entry?: JournalEntry | null;
  accounts: Account[];
  currencies: Currency[];
  financialYears: FinancialYear[];
  defaultFinancialYearId?: string;
  defaultCurrencyId?: string;
  onSubmit: (data: JournalEntryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Form validation schema - accepts financialYears for date validation
const createJournalEntrySchema = (financialYears: FinancialYear[]) => {
  return yup.object({
    entryDate: yup
      .string()
      .required('Entry date is required')
      .test('date-within-financial-year', function(value) {
        // Get financial year from form context (parent)
        const formFinancialYearId = this.parent?.financialYearId;
        const selectedFY = financialYears.find(fy => fy.id === formFinancialYearId);
        
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
    description: yup.string().optional(),
    financialYearId: yup.string().required('Financial year is required'),
    currencyId: yup.string().optional(),
    lines: yup
      .array()
      .of(
        yup.object({
          accountId: yup.string().required('Account is required'),
          type: yup.string().oneOf(['debit', 'credit']).required('Type is required'),
          amount: yup.number().required('Amount is required').min(0.01, 'Amount must be greater than 0'),
          originalAmount: yup.number().optional(),
          exchangeRate: yup.number().optional(),
          description: yup.string().optional()
        })
      )
      .min(2, 'At least two line items are required')
      .test('balanced', 'Total debits must equal total credits', function(lines) {
        if (!lines || lines.length < 2) return true;
        
        const totalDebit = lines
          .filter(line => line.type === 'debit')
          .reduce((sum, line) => sum + (parseFloat(line.amount?.toString() || '0') || 0), 0);
        
        const totalCredit = lines
          .filter(line => line.type === 'credit')
          .reduce((sum, line) => sum + (parseFloat(line.amount?.toString() || '0') || 0), 0);
        
        const difference = Math.abs(totalDebit - totalCredit);
        return difference < 0.01; // Allow for small rounding differences
      })
  }) as yup.ObjectSchema<JournalEntryFormData>;
};

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  isOpen = true,
  entry,
  accounts,
  currencies,
  financialYears,
  defaultFinancialYearId,
  defaultCurrencyId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const { isSidebarCollapsed } = useSidebar();

  // Fetch company data to get default currency
  const { data: companyData } = useQuery<Company | null>({
    queryKey: ['company'],
    queryFn: async () => {
      const response = await apiService.get<Company>('/company');
      return response.success && response.data ? response.data : null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Get default currency symbol and code
  const defaultCurrencySymbol = companyData?.defaultCurrency?.symbol || '$';
  const defaultCurrencyCode = companyData?.defaultCurrency?.code || 'USD';
  const defaultCurrency = companyData?.defaultCurrency;

  // Fetch exchange rates
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const rates = await getAllActiveExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        setExchangeRates([]);
      }
    };
    loadExchangeRates();
  }, []);

  const JOURNAL_ENTRY_COLUMNS_VISIBILITY_KEY = 'easymauzo-journal-entry-columns-visibility';

  // Default column visibility (Exchange Rate, Original Amount, Description hidden by default; Equivalent Amount shown by default)
  const defaultVisibleColumns = {
    account: true,
    type: true,
    amount: true,
    exchangeRate: false,
    originalAmount: false,
    equivalentAmount: true,
    description: false,
    actions: true
  };

  // Column visibility state for items table - Initialize from localStorage or use defaults
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const savedState = localStorage.getItem(JOURNAL_ENTRY_COLUMNS_VISIBILITY_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge with defaults to ensure any new columns are included
        // User preferences take precedence, but new columns get default visibility
        const merged = { ...defaultVisibleColumns, ...parsed };
        // Ensure all default columns exist (in case new columns were added)
        Object.keys(defaultVisibleColumns).forEach(key => {
          if (!(key in merged)) {
            merged[key as keyof typeof merged] = defaultVisibleColumns[key as keyof typeof defaultVisibleColumns];
          }
        });
        return merged;
      }
      return defaultVisibleColumns;
    } catch (error) {
      return defaultVisibleColumns;
    }
  });

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_ENTRY_COLUMNS_VISIBILITY_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      // Handle localStorage errors silently in production
    }
  }, [visibleColumns]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('journal-entry-items-columns-dropdown');
      const target = event.target as HTMLElement;
      if (dropdown && !dropdown.contains(target)) {
        // Check if click is on the More Columns button
        const button = target.closest('button');
        if (!button || !button.querySelector('svg') || !button.textContent?.includes('More Columns')) {
          dropdown.classList.add('hidden');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show description state with localStorage persistence
  const [showDescription, setShowDescription] = useState(() => {
    const saved = localStorage.getItem('journalEntry_showDescription');
    return saved ? JSON.parse(saved) : false;
  });

  // Handle toggle description with localStorage persistence
  const handleToggleDescription = useCallback(() => {
    const newState = !showDescription;
    setShowDescription(newState);
    localStorage.setItem('journalEntry_showDescription', JSON.stringify(newState));
  }, [showDescription]);

  // Find current financial year if not provided
  const currentFY = useMemo(() => {
    if (entry?.financialYearId) return null; // Don't override if editing
    if (defaultFinancialYearId) return null; // Don't override if explicitly provided
    return financialYears.find(fy => fy.isCurrent && fy.isActive) || null;
  }, [entry?.financialYearId, defaultFinancialYearId, financialYears]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
    setValue,
    trigger,
    reset
  } = useForm<JournalEntryFormData>({
    resolver: yupResolver(createJournalEntrySchema(financialYears)),
    defaultValues: {
      entryDate: entry?.entryDate || new Date().toISOString().split('T')[0],
      description: entry?.description || '',
      financialYearId: entry?.financialYearId || defaultFinancialYearId || currentFY?.id || '',
      currencyId: entry?.currencyId || defaultCurrencyId || '',
      lines: entry?.lines?.map(line => ({
        accountId: line.accountId,
        type: line.type,
        amount: parseFloat(line.amount.toString()) || 0,
        originalAmount: line.originalAmount ? parseFloat(line.originalAmount.toString()) : undefined,
        exchangeRate: line.exchangeRate || 1,
        description: line.description || ''
      })) || [
        { accountId: '', type: 'debit' as const, amount: 0 },
        { accountId: '', type: 'credit' as const, amount: 0 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const watchedLines = watch('lines');
  const watchedFinancialYearId = watch('financialYearId');
  const watchedEntryDate = watch('entryDate');
  const watchedCurrencyId = watch('currencyId');

  // Calculate totals
  const totals = useMemo(() => {
    if (!watchedLines || watchedLines.length === 0) {
      return { totalDebit: 0, totalCredit: 0, difference: 0, isBalanced: true };
    }

    const totalDebit = watchedLines
      .filter(line => line.type === 'debit')
      .reduce((sum, line) => sum + (parseFloat(line.amount?.toString() || '0') || 0), 0);
    
    const totalCredit = watchedLines
      .filter(line => line.type === 'credit')
      .reduce((sum, line) => sum + (parseFloat(line.amount?.toString() || '0') || 0), 0);
    
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;
    
    return { totalDebit, totalCredit, difference, isBalanced };
  }, [watchedLines]);

  // Get selected financial year
  const selectedFinancialYear = useMemo(() => {
    const financialYearId = watchedFinancialYearId || defaultFinancialYearId;
    return financialYears.find(fy => fy.id === financialYearId) || null;
  }, [watchedFinancialYearId, defaultFinancialYearId, financialYears]);

  // Get min and max dates based on financial year
  const minDate = selectedFinancialYear?.startDate || '';
  const maxDate = selectedFinancialYear?.endDate || '';

  // Update validation schema when financial year changes
  useEffect(() => {
    if (selectedFinancialYear) {
      // Trigger validation to re-check date against new financial year
      trigger('entryDate');
    }
  }, [selectedFinancialYear, trigger]);

  // Reset form when entry changes or when opening for a new entry
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        // Editing existing entry - populate form with entry data
        reset({
          entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
          description: entry.description || '',
          financialYearId: entry.financialYearId || defaultFinancialYearId || currentFY?.id || '',
          currencyId: entry.currencyId || defaultCurrencyId || '',
          lines: entry.lines?.map(line => ({
            accountId: line.accountId,
            type: line.type,
            amount: parseFloat(line.amount.toString()) || 0,
            originalAmount: line.originalAmount ? parseFloat(line.originalAmount.toString()) : undefined,
            exchangeRate: line.exchangeRate || 1,
            description: line.description || ''
          })) || [
            { accountId: '', type: 'debit' as const, amount: 0 },
            { accountId: '', type: 'credit' as const, amount: 0 }
          ]
        });
      } else {
        // Creating new entry - reset to default values
        const currentFYId = currentFY?.id || defaultFinancialYearId || '';
        reset({
          entryDate: new Date().toISOString().split('T')[0],
          description: '',
          financialYearId: currentFYId,
          currencyId: defaultCurrencyId || '',
          lines: [
            { accountId: '', type: 'debit' as const, amount: 0 },
            { accountId: '', type: 'credit' as const, amount: 0 }
          ]
        });
      }
    }
  }, [isOpen, entry, reset, defaultFinancialYearId, currentFY?.id, defaultCurrencyId]);

  // Auto-select current financial year on form open (always use current year if not editing)
  useEffect(() => {
    if (!entry && currentFY) {
      // Always set to current financial year for new entries
      setValue('financialYearId', currentFY.id, { shouldValidate: true });
    } else if (entry && !watchedFinancialYearId) {
      // If editing and no financial year set, use the entry's financial year
      setValue('financialYearId', entry.financialYearId, { shouldValidate: true });
    } else if (!entry && !currentFY && financialYears.length > 0) {
      // Fallback: use first active financial year if no current year found
      const firstActiveFY = financialYears.find(fy => fy.isActive);
      if (firstActiveFY) {
        setValue('financialYearId', firstActiveFY.id, { shouldValidate: true });
      }
    }
  }, [entry, currentFY, watchedFinancialYearId, setValue, financialYears]);

  // Auto-adjust date when financial year changes (if date is outside range)
  useEffect(() => {
    if (selectedFinancialYear && watchedEntryDate) {
      const dateValue = new Date(watchedEntryDate);
      const startDate = new Date(selectedFinancialYear.startDate);
      const endDate = new Date(selectedFinancialYear.endDate);
      
      // If date is outside range, set it to start date
      if (dateValue < startDate || dateValue > endDate) {
        setValue('entryDate', selectedFinancialYear.startDate);
      }
    }
  }, [selectedFinancialYear, watchedEntryDate, setValue]);

  // Auto-update exchange rates for all lines when currency changes
  useEffect(() => {
    if (watchedCurrencyId && defaultCurrency && exchangeRates.length > 0 && fields.length > 0) {
      let exchangeRateValue = 1.0;
      
      // If selected currency is the same as default currency, rate is 1
      if (watchedCurrencyId === defaultCurrency.id) {
        exchangeRateValue = 1.0;
      } else {
        // Find exchange rate from selected currency to default currency
        const rate = exchangeRates.find(rate => 
          rate.from_currency_id === watchedCurrencyId && 
          rate.to_currency_id === defaultCurrency.id
        );
        
        if (rate) {
          // Ensure the rate is parsed as a number
          const parsedRate = typeof rate.rate === 'string' ? parseFloat(rate.rate) : Number(rate.rate);
          if (Number.isFinite(parsedRate) && parsedRate > 0) {
            exchangeRateValue = parsedRate;
          }
        }
      }

      // Update exchange rate for all line items
      fields.forEach((field, index) => {
        setValue(`lines.${index}.exchangeRate`, exchangeRateValue, { shouldValidate: false });
        // Recalculate equivalent amount if original amount exists
        const currentValues = getValues();
        const line = currentValues.lines?.[index];
        const originalAmount = line?.originalAmount || line?.amount || 0;
        if (originalAmount > 0) {
          const equivalentAmount = originalAmount * exchangeRateValue;
          setValue(`lines.${index}.amount`, equivalentAmount, { shouldValidate: true });
        }
      });
    }
  }, [watchedCurrencyId, defaultCurrency, exchangeRates, fields, setValue, getValues]);

  // Account options for SearchableDropdown
  const accountOptions = useMemo(() => {
    return accounts.map(account => ({
      id: account.id,
      value: account.id,
      label: `${account.code} - ${account.name}`,
      code: account.code,
      name: account.name,
      type: (account as any).accountType?.name || ''
    }));
  }, [accounts]);

  // Currency options
  const currencyOptions = useMemo(() => {
    return currencies.map(currency => ({
      value: currency.id,
      label: `${currency.code} - ${currency.name}`
    }));
  }, [currencies]);

  // Handle form submission
  const onSubmitForm = async (data: JournalEntryFormData) => {
    await onSubmit(data);
  };

  // Add new line
  const handleAddLine = () => {
    append({ accountId: '', type: 'debit', amount: 0 });
  };

  // Handle account change for a specific line
  const handleAccountChange = (index: number, value: string) => {
    setValue(`lines.${index}.accountId`, value, { shouldValidate: true });
  };

  // Handle exchange rate or original amount change - auto-calculate equivalent amount
  const handleExchangeRateChange = (index: number, value: number) => {
    setValue(`lines.${index}.exchangeRate`, value || 1, { shouldValidate: false });
    const originalAmount = parseFloat(watch(`lines.${index}.originalAmount`)?.toString() || watch(`lines.${index}.amount`)?.toString() || '0') || 0;
    const equivalentAmount = originalAmount * (value || 1);
    setValue(`lines.${index}.amount`, equivalentAmount, { shouldValidate: true });
  };

  // Handle original amount change - auto-calculate equivalent amount
  const handleOriginalAmountChange = (index: number, value: number) => {
    setValue(`lines.${index}.originalAmount`, value || 0, { shouldValidate: false });
    const exchangeRate = parseFloat(watch(`lines.${index}.exchangeRate`)?.toString() || '1') || 1;
    const equivalentAmount = (value || 0) * exchangeRate;
    setValue(`lines.${index}.amount`, equivalentAmount, { shouldValidate: true });
  };

  // Format amount using company default currency
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, defaultCurrencyCode, defaultCurrencySymbol);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
        <div className={`bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto ${isSidebarCollapsed ? 'max-w-[85vw]' : 'max-w-[70vw]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-6">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Date <span className="text-red-500">*</span>
                {selectedFinancialYear && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({selectedFinancialYear.startDate} - {selectedFinancialYear.endDate})
                  </span>
                )}
              </label>
              <input
                type="date"
                {...register('entryDate')}
                min={minDate}
                max={maxDate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.entryDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.entryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.entryDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                {...register('currencyId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{defaultCurrencyCode} (Default)</option>
                {currencyOptions.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleToggleDescription}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  {showDescription ? (
                    <>
                      <ChevronUp size={14} className="mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mr-1" />
                      Show
                    </>
                  )}
                </button>
              </div>
              {showDescription && (
                <textarea
                  {...register('description')}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>
          </div>
          
          {/* Hidden Financial Year Field - automatically set to current year */}
          <input
            type="hidden"
            {...register('financialYearId')}
          />

          {/* Line Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
              <div className="flex items-center gap-2">
                {/* More Columns Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const dropdown = document.getElementById('journal-entry-items-columns-dropdown');
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
                    id="journal-entry-items-columns-dropdown"
                    className="hidden absolute w-64 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] transition-all duration-200"
                    style={{
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      maxHeight: '300px'
                    }}
                  >
                    <div className="py-2">
                      {/* Toggle All Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const allVisible = Object.values(visibleColumns).every(v => v);
                          const newState = Object.keys(visibleColumns).reduce((acc, key) => {
                            // Keep required columns always visible
                            if (key === 'account' || key === 'type' || key === 'amount' || key === 'actions') {
                              acc[key as keyof typeof visibleColumns] = true;
                            } else {
                              acc[key as keyof typeof visibleColumns] = !allVisible;
                            }
                            return acc;
                          }, {} as typeof visibleColumns);
                          setVisibleColumns(newState);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                      >
                        {Object.entries(visibleColumns).filter(([key]) => 
                          key !== 'account' && key !== 'type' && key !== 'amount' && key !== 'actions'
                        ).every(([, v]) => v) ? 'Hide All Optional' : 'Show All'}
                      </button>
                      
                      {/* Scrollable Column List */}
                      <div className="max-h-64 overflow-y-auto">
                        {Object.entries(visibleColumns).map(([key, visible]) => {
                          const isRequired = key === 'account' || key === 'type' || key === 'amount' || key === 'actions';
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!isRequired) {
                                  setVisibleColumns((prev: typeof defaultVisibleColumns) => ({
                                    ...prev,
                                    [key]: !prev[key as keyof typeof prev]
                                  }));
                                }
                              }}
                              disabled={isRequired}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                                isRequired ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                              }`}
                            >
                              <span className="truncate capitalize">
                                {key === 'exchangeRate' ? 'Exchange Rate' : 
                                 key === 'originalAmount' ? 'Original Amount' :
                                 key === 'equivalentAmount' ? 'Equivalent Amount' :
                                 key.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {visible ? (
                                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                ) : (
                                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                )}
                                {isRequired && (
                                  <span className="text-xs text-gray-400">Required</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white"
                  style={{ backgroundColor: '#f87b1b' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e66a0a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f87b1b'}
                >
                  <Plus size={16} className="mr-2" />
                  Add Line
                </button>
              </div>
            </div>

            {errors.lines && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <p className="text-sm text-red-600">{errors.lines.message}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.account && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    )}
                    {visibleColumns.type && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    )}
                    {visibleColumns.amount && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    )}
                    {visibleColumns.exchangeRate && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange Rate</th>
                    )}
                    {visibleColumns.originalAmount && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amount</th>
                    )}
                    {visibleColumns.equivalentAmount && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Equivalent Amount</th>
                    )}
                    {visibleColumns.description && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field, index) => {
                    const accountId = watch(`lines.${index}.accountId`);
                    const exchangeRate = parseFloat(watch(`lines.${index}.exchangeRate`)?.toString() || '1') || 1;
                    const amount = parseFloat(watch(`lines.${index}.amount`)?.toString() || '0') || 0;
                    const originalAmount = parseFloat(watch(`lines.${index}.originalAmount`)?.toString() || amount.toString()) || amount;
                    const equivalentAmount = originalAmount * exchangeRate;
                    
                    return (
                      <tr key={field.id}>
                        {visibleColumns.account && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <SearchableDropdown
                              options={accountOptions}
                              value={accountId || ''}
                              onChange={(value) => handleAccountChange(index, value)}
                              placeholder="Select Account"
                              searchPlaceholder="Search accounts by code or name..."
                              disabled={isLoading}
                              error={!!errors.lines?.[index]?.accountId}
                              className="w-full"
                            />
                            {errors.lines?.[index]?.accountId && (
                              <p className="mt-1 text-xs text-red-600">{errors.lines[index]?.accountId?.message}</p>
                            )}
                          </td>
                        )}
                        {visibleColumns.type && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              {...register(`lines.${index}.type`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="debit">Debit</option>
                              <option value="credit">Credit</option>
                            </select>
                          </td>
                        )}
                        {visibleColumns.amount && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`lines.${index}.amount`, { valueAsNumber: true })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                            />
                            {errors.lines?.[index]?.amount && (
                              <p className="mt-1 text-xs text-red-600">{errors.lines[index]?.amount?.message}</p>
                            )}
                          </td>
                        )}
                        {visibleColumns.exchangeRate && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              {...register(`lines.${index}.exchangeRate`, { valueAsNumber: true })}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 1;
                                handleExchangeRateChange(index, value);
                              }}
                              placeholder="1.0000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                            />
                          </td>
                        )}
                        {visibleColumns.originalAmount && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`lines.${index}.originalAmount`, { valueAsNumber: true })}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleOriginalAmountChange(index, value);
                              }}
                              placeholder={originalAmount.toString()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                            />
                          </td>
                        )}
                        {visibleColumns.equivalentAmount && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-right text-sm text-gray-600">
                              {formatAmount(equivalentAmount)}
                            </div>
                          </td>
                        )}
                        {visibleColumns.description && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="text"
                              {...register(`lines.${index}.description`)}
                              placeholder="Optional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {fields.length > 2 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(v => v).length - (visibleColumns.amount ? 1 : 0) - (visibleColumns.description ? 1 : 0) - (visibleColumns.actions ? 1 : 0)} className="px-4 py-3 text-sm font-medium text-gray-900">
                      Total
                    </td>
                    {visibleColumns.amount && (
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${totals.isBalanced ? 'text-gray-900' : 'text-red-600'}`}>
                            Debit: {formatAmount(totals.totalDebit)}
                          </div>
                          <div className={`text-sm font-medium ${totals.isBalanced ? 'text-gray-900' : 'text-red-600'}`}>
                            Credit: {formatAmount(totals.totalCredit)}
                          </div>
                          {!totals.isBalanced && (
                            <div className="text-xs text-red-600">
                              Difference: {formatAmount(totals.difference)}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.description && <td></td>}
                    {visibleColumns.actions && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !totals.isBalanced}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Saving...' : entry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryForm;

