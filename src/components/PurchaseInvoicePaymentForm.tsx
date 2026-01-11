import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseInvoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import Input from './Input';
import SearchableDropdown from './SearchableDropdown';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, X, Save, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { customerDepositService } from '../services/customerDepositService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import { accountService } from '../services/accountService';
import { linkedAccountService } from '../services/linkedAccountService';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface PurchaseInvoicePaymentFormProps {
  purchaseInvoice: PurchaseInvoice;
  onClose: () => void;
  onSubmit: (paymentData: InvoicePaymentData) => Promise<void>;
  isLoading?: boolean;
  isOpen?: boolean;
}

export interface InvoicePaymentData {
  paymentAmount: number;
  paymentTypeId?: string;
  useVendorDeposit?: boolean;
  depositAmount?: number;
  itemPayments?: Record<string, number>; // Item-level payment allocation
  chequeNumber?: string;
  bankDetailId?: string;
  branch?: string;
  currencyId: string;
  exchangeRate: number;
  exchangeRateId?: string;
  description?: string;
  transactionDate: string;
  payableAccountId?: string;
}

const PurchaseInvoicePaymentForm: React.FC<PurchaseInvoicePaymentFormProps> = ({
  purchaseInvoice,
  onClose,
  onSubmit,
  isLoading = false,
  isOpen = true
}) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethodType, setPaymentMethodType] = useState<'payment_type' | 'deposit_account'>('payment_type');
  const [paymentTypeId, setPaymentTypeId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [bankDetailId, setBankDetailId] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [currencyId, setCurrencyId] = useState<string>(purchaseInvoice.currencyId || '');
  const [exchangeRate, setExchangeRate] = useState<number>(purchaseInvoice.exchangeRateValue || 1.0);
  const [exchangeRateId, setExchangeRateId] = useState<string>(purchaseInvoice.exchangeRateId || '');
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payableAccountId, setPayableAccountId] = useState<string>(purchaseInvoice.accountPayableId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPaymentType, setSelectedPaymentType] = useState<any>(null);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
  // Item-level payment amounts (keyed by item id or index)
  const [itemPayments, setItemPayments] = useState<Record<string, number>>({});

  // Fetch data - get payment types for creditor payments (vendor payments)
  const { data: paymentTypes = [] } = useQuery({
    queryKey: ['payment-types-creditor-payments'],
    queryFn: async () => {
      // Try to get creditor payment types, fallback to all payment types
      try {
        const response = await api.get('/payment-types?status=active&used_in_creditor_payments=true&limit=1000');
        const data = response.data.paymentTypes || response.data;
        return Array.isArray(data) ? data : [];
      } catch {
        // Fallback to all payment types if creditor-specific endpoint doesn't exist
        try {
          return await customerDepositService.getPaymentTypes();
        } catch {
          return [];
        }
      }
    }
  });

  const { data: bankDetails = [] } = useQuery({
    queryKey: ['bank-details'],
    queryFn: customerDepositService.getBankDetails
  });

  const { data: currencies = [], isLoading: isLoadingCurrencies, error: currenciesError } = useQuery({
    queryKey: ['currencies', 'payment-form'],
    queryFn: customerDepositService.getCurrencies,
    enabled: isOpen && !!purchaseInvoice // Only fetch when modal is open and invoice is available
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: getAllActiveExchangeRates
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['leaf-accounts', 'payment-form'],
    queryFn: accountService.getLeafAccounts,
    enabled: isOpen
  });

  // Get default currency
  const defaultCurrency = useMemo(() => {
    if (!Array.isArray(currencies)) return null;
    return currencies.find(currency => currency.is_default);
  }, [currencies]);

  // Get vendor deposit balance
  const vendorDepositBalance = useMemo(() => {
    return purchaseInvoice.vendor?.deposit_balance || 0;
  }, [purchaseInvoice.vendor]);

  // Calculate total payment amount from item payments
  const calculatedPaymentAmount = useMemo(() => {
    return Object.values(itemPayments).reduce((sum, amount) => sum + (amount || 0), 0);
  }, [itemPayments]);


  // Calculate total payment including deposit
  const totalPaymentAmount = useMemo(() => {
    if (paymentMethodType === 'deposit_account') {
      // For deposit account, the payment amount is the sum of item payments (entered in items)
      return calculatedPaymentAmount;
    } else {
      // For payment_type, the payment amount is the sum of item payments
      return calculatedPaymentAmount;
    }
  }, [calculatedPaymentAmount, paymentMethodType]);

  // Update paymentAmount when item payments or deposit changes (only on step 2)
  useEffect(() => {
    if (currentStep === 2) {
      setPaymentAmount(totalPaymentAmount);
    }
  }, [totalPaymentAmount, currentStep]);

  // Clear errors when step changes to avoid showing stale errors
  useEffect(() => {
    // Clear errors when moving to a new step
    setErrors({});
  }, [currentStep]);

  // Calculate balance after payment
  const balanceAfterPayment = useMemo(() => {
    const currentBalance = purchaseInvoice.balanceAmount || purchaseInvoice.totalAmount;
    const amountToUse = currentStep === 2 ? totalPaymentAmount : paymentAmount;
    return Math.max(0, currentBalance - amountToUse);
  }, [purchaseInvoice.balanceAmount, purchaseInvoice.totalAmount, paymentAmount, totalPaymentAmount, currentStep]);

  // Calculate equivalent amount
  const equivalentAmount = useMemo(() => {
    const amountToUse = currentStep === 2 ? totalPaymentAmount : paymentAmount;
    return amountToUse * exchangeRate;
  }, [paymentAmount, totalPaymentAmount, exchangeRate, currentStep]);

  // Payment type options - filter to only show payment types allowed for creditor payments (vendor payments)
  const paymentTypeOptions = useMemo(() => {
    if (!Array.isArray(paymentTypes)) return [];
    
    return paymentTypes
      .filter(paymentType => (paymentType.used_in_creditor_payments || paymentType.is_active) && paymentType.is_active)
      .map(paymentType => ({
        id: paymentType.id,
        value: paymentType.id,
        label: paymentType.name,
        name: paymentType.name,
        code: paymentType.code,
        paymentMethod: paymentType.paymentMethod
      }));
  }, [paymentTypes]);

  // Bank detail options
  const bankDetailOptions = useMemo(() => {
    if (!Array.isArray(bankDetails)) return [];
    return bankDetails.map(bank => ({
      id: bank.id,
      value: bank.id,
      label: `${bank.bankName} - ${bank.branch}`,
      bankName: bank.bankName,
      branch: bank.branch
    }));
  }, [bankDetails]);

  // Currency options
  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies) || currencies.length === 0) {
      return [];
    }
    return currencies.map(currency => ({
      id: currency.id,
      value: currency.id,
      label: `${currency.code} - ${currency.name}`,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol
    }));
  }, [currencies, isLoadingCurrencies, currenciesError]);

  // Set currency and exchange rate from invoice when currencies are loaded (only if not already set)
  useEffect(() => {
    if (currencies.length > 0 && purchaseInvoice.currencyId && !currencyId) {
      // Set currency from invoice
      setCurrencyId(purchaseInvoice.currencyId);
      
      // Set exchange rate from invoice if available
      if (purchaseInvoice.exchangeRateValue) {
        setExchangeRate(purchaseInvoice.exchangeRateValue);
      }
      if (purchaseInvoice.exchangeRateId) {
        setExchangeRateId(purchaseInvoice.exchangeRateId);
      }
    }
  }, [currencies, purchaseInvoice.currencyId, purchaseInvoice.exchangeRateValue, purchaseInvoice.exchangeRateId, currencyId]);

  // Auto-fill exchange rate when currency changes
  useEffect(() => {
    if (currencyId && defaultCurrency && exchangeRates.length > 0) {
      if (currencyId === defaultCurrency.id) {
        setExchangeRate(1.0);
        setExchangeRateId('');
      } else {
        const rate = exchangeRates.find(rate => 
          rate.from_currency_id === currencyId && 
          rate.to_currency_id === defaultCurrency.id
        );
        if (rate) {
          setExchangeRate(rate.rate);
          setExchangeRateId(rate.id);
        } else {
          setExchangeRate(1.0);
          setExchangeRateId('');
        }
      }
    }
  }, [currencyId, defaultCurrency, exchangeRates]);

  // Fetch linked accounts
  const { data: linkedAccounts = [] } = useQuery({
    queryKey: ['linked-accounts', 'payment-form'],
    queryFn: linkedAccountService.getLinkedAccounts,
    enabled: isOpen
  });

  // Set receivable account when Account Balance or Loyalty Card is selected and linked accounts are loaded
  // Note: This effect should NOT run when payableAccountId changes (user selection) - only when payment method or linked accounts change
  useEffect(() => {
    let accountToSet = '';
    
    if (paymentMethodType === 'deposit_account') {
      // For Account Balance, ALWAYS use invoice's receivable account for the credit entry
      // The account_balance linked account is only used for the debit entry (reducing vendor deposit)
      // The credit entry must always go to Accounts Receivable
        accountToSet = purchaseInvoice.accountPayableId || '';
    } else if (paymentMethodType === 'payment_type') {
      // For payment type, use invoice's default receivable account
      accountToSet = purchaseInvoice.accountPayableId || '';
    }
    
    // Only update if we have an account to set and it's different from current value
    // This prevents clearing a user-selected account
    if (accountToSet && accountToSet !== payableAccountId) {
      setPayableAccountId(accountToSet);
      // Clear error if account is set
      setErrors(prev => {
        if (prev.payableAccountId) {
          return { ...prev, payableAccountId: '' };
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethodType, linkedAccounts, purchaseInvoice.accountPayableId]);
  // Note: payableAccountId is intentionally excluded from dependencies to prevent resetting user selections

  // When Account Balance is selected, ensure currency and exchange rate are set from invoice
  useEffect(() => {
    if (paymentMethodType === 'deposit_account') {
      // Set currency from invoice if not already set
      if (purchaseInvoice.currencyId && !currencyId) {
        setCurrencyId(purchaseInvoice.currencyId);
      }
      // Set exchange rate from invoice if not already set
      if (purchaseInvoice.exchangeRateValue && (!exchangeRate || exchangeRate === 1.0)) {
        setExchangeRate(purchaseInvoice.exchangeRateValue);
      }
      if (purchaseInvoice.exchangeRateId && !exchangeRateId) {
        setExchangeRateId(purchaseInvoice.exchangeRateId);
      }
    }
  }, [paymentMethodType, purchaseInvoice.currencyId, purchaseInvoice.exchangeRateValue, purchaseInvoice.exchangeRateId, currencyId, exchangeRate, exchangeRateId]);

  // Clear receivable account error when account is set
  useEffect(() => {
    if (payableAccountId && errors.payableAccountId) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.payableAccountId;
        return updated;
      });
    }
  }, [payableAccountId, errors.payableAccountId]);

  // Account options for receivable account dropdown
  const accountOptions = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    return accounts.map(account => ({
      id: account.id,
      value: account.id,
      label: `${account.code} - ${account.name}`,
      code: account.code,
      name: account.name
    }));
  }, [accounts]);

  // Handle payment method type change (radio buttons)
  const handlePaymentMethodTypeChange = (type: 'payment_type' | 'deposit_account') => {
    setPaymentMethodType(type);
    
    // Clear all payment-related fields
    setPaymentTypeId('');
    setDepositAmount(0);
    setSelectedPaymentType(null);
    setChequeNumber('');
    setBankDetailId('');
    setBranch('');
    
    // Set receivable account based on payment method type
    let newReceivableAccountId = '';
    
    if (type === 'deposit_account') {
      // For Account Balance, ALWAYS use invoice's receivable account for the credit entry
      // The account_balance linked account is only used for the debit entry (reducing vendor deposit)
      // The credit entry must always go to Accounts Receivable
        newReceivableAccountId = purchaseInvoice.accountPayableId || '';
    } else if (type === 'payment_type') {
      // For payment type, use invoice's default receivable account
      newReceivableAccountId = purchaseInvoice.accountPayableId || '';
    }
    
    setPayableAccountId(newReceivableAccountId);
    
    // Clear errors (including payableAccountId if account is set)
    setErrors(prev => {
      const updated: Record<string, string> = {
        ...prev,
        paymentTypeId: '',
        depositAmount: ''
      };
      // Clear payableAccountId error if account is set
      // Note: We don't clear the error here if account is empty - let validation handle it
      // This allows the user to see that they need to select a payable account
      if (newReceivableAccountId && updated.payableAccountId) {
        delete updated.payableAccountId;
      }
      return updated;
    });
  };

  // Handle payment type change (dropdown)
  const handlePaymentTypeChange = (value: string) => {
    const paymentType = paymentTypes.find(pt => pt.id === value);
    setSelectedPaymentType(paymentType || null);
    setPaymentTypeId(value);
    
    // Note: Do NOT set payableAccountId to payment type's default account
    // The payment type's default account is only used for the asset account (debit entry)
    // The receivable account (credit entry) should always be the invoice's receivable account
    // This ensures correct double-entry: Debit Asset Account, Credit Accounts Receivable
    
    // Clear conditional fields
    setChequeNumber('');
    setBankDetailId('');
    setBranch('');
    
    // Clear errors
    if (errors.paymentTypeId) {
      setErrors(prev => ({ ...prev, paymentTypeId: '' }));
    }
  };

  // Handle bank detail change
  const handleBankDetailChange = (value: string) => {
    const bankDetail = bankDetails.find(bd => bd.id === value);
    setBankDetailId(value);
    if (bankDetail) {
      setBranch(bankDetail.branch);
    }
  };

  // Set max payment amount to balance
  useEffect(() => {
    const maxAmount = purchaseInvoice.balanceAmount || purchaseInvoice.totalAmount;
    if (paymentAmount > maxAmount) {
      setPaymentAmount(maxAmount);
    }
  }, [purchaseInvoice.balanceAmount, purchaseInvoice.totalAmount]);

  // Validate step 2 (Item Payments)
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    // Validate item payments
    if (purchaseInvoice.items && purchaseInvoice.items.length > 0) {
      purchaseInvoice.items.forEach((item: any, index: number) => {
        const itemKey = item.id || `item-${index}`;
        const itemTotal = item.lineTotal || item.totalAmount || 0;
        const itemPaidSoFar = purchaseInvoice.itemPaidAmounts?.[item.id] || 0;
        const itemPayment = itemPayments[itemKey] || 0;
        const remainingBalance = itemTotal - itemPaidSoFar;

        if (itemPayment < 0) {
          newErrors[`itemPayment_${itemKey}`] = 'Payment amount cannot be negative';
          hasErrors = true;
        }

        if (itemPayment > remainingBalance) {
          newErrors[`itemPayment_${itemKey}`] = `Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance, currencySymbol)}`;
          hasErrors = true;
        }
      });
    }

     // Validate account balance amount if using account balance
     // The deposit amount is calculated from item payments
     // IMPORTANT: Vendor deposit balance is stored in system currency, so we need to convert invoice currency to system currency
     if (paymentMethodType === 'deposit_account') {
       const totalItemPayments = calculatedPaymentAmount;
       
       if (totalItemPayments <= 0) {
         // Error message removed as requested
         hasErrors = true;
       }

       // Convert invoice currency payment amount to system currency for comparison
       const totalItemPaymentsInSystemCurrency = totalItemPayments * exchangeRate;
       
       if (totalItemPaymentsInSystemCurrency > vendorDepositBalance) {
         newErrors.depositAmount = `Total payment amount (${formatCurrency(totalItemPayments, currencySymbol)}) cannot exceed available balance of ${formatCurrency(vendorDepositBalance / exchangeRate, currencySymbol)}`;
         hasErrors = true;
       }
     }

     // Validate vendor deposit if using deposit account
     if (paymentMethodType === 'deposit_account') {
       // Validate that vendor has sufficient deposit balance
       if (vendorDepositBalance <= 0) {
         newErrors.depositAmount = 'No vendor deposit balance available';
         hasErrors = true;
       }
     }

     // Validate that at least some item payments are entered
     const hasItemPayments = Object.values(itemPayments).some(amount => amount > 0);
     if (!hasItemPayments && paymentMethodType !== 'deposit_account') {
       // Error message removed as requested
       hasErrors = true;
     }

     // Validate total payment amount (items + deposit/loyalty)
     if (totalPaymentAmount <= 0) {
       hasErrors = true;
     }

     // Validate total payment amount doesn't exceed balance
     // For account balance, the validation is done against available balance
     // So we only validate against invoice balance for payment_type
     if (paymentMethodType === 'payment_type') {
       // Use a small tolerance (0.01) to account for floating point rounding errors
     const maxAmount = purchaseInvoice.balanceAmount || purchaseInvoice.totalAmount;
       const tolerance = 0.01; // Allow small rounding differences
       if (totalPaymentAmount > maxAmount + tolerance) {
         newErrors.paymentAmount = `Total payment amount (${formatCurrency(totalPaymentAmount, purchaseInvoice.currencySymbol)}) cannot exceed balance of ${formatCurrency(maxAmount, purchaseInvoice.currencySymbol)}`;
       hasErrors = true;
       }
     } else {
       // For account balance, validate against vendor deposit balance
       // Account balance validation is done above (against vendorDepositBalance)
       // Additional validation: ensure payment doesn't exceed invoice balance with tolerance
       const maxAmount = purchaseInvoice.balanceAmount || purchaseInvoice.totalAmount;
       const tolerance = 0.01; // Allow small rounding differences
       if (totalPaymentAmount > maxAmount + tolerance) {
         // Payment amount exceeds invoice balance - validation will handle this
       }
     }

    setErrors(newErrors);
    return !hasErrors;
  };

  // Validate step 1 (Payment Details)
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // On step 1, payment amount is NOT validated (will be calculated from items on step 2)
    // Note: Deposit amount and loyalty points validation is done in step 2
    // Note: Payment amount validation is done in step 2

    // Validate payment type only if using payment_type method
    if (paymentMethodType === 'payment_type') {
      if (!paymentTypeId) {
      newErrors.paymentTypeId = 'Payment type is required';
      } else {
        // Validate cheque number if payment method requires it
        if (selectedPaymentType?.paymentMethod?.requiresChequeNumber && !chequeNumber) {
          newErrors.chequeNumber = 'Cheque number is required for this payment type';
        }

        // Validate bank details if payment method requires it
        if (selectedPaymentType?.paymentMethod?.requiresBankDetails && !bankDetailId) {
          newErrors.bankDetailId = 'Bank details are required for this payment type';
        }
      }
    }

    // Currency validation - Skip if using Account Balance
    if (paymentMethodType !== 'deposit_account') {
    if (!currencyId) {
      newErrors.currencyId = 'Currency is required';
    }

      // Exchange rate validation
    if (!exchangeRate || exchangeRate <= 0) {
      newErrors.exchangeRate = 'Exchange rate is required and must be greater than 0';
    }
    }

    // Transaction date validation
    if (!transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
    } else {
      // Validate transaction date is not earlier than invoice date
      const invoiceDate = new Date(purchaseInvoice.invoiceDate);
      const paymentDate = new Date(transactionDate);
      
      // Set time to midnight for accurate date comparison
      invoiceDate.setHours(0, 0, 0, 0);
      paymentDate.setHours(0, 0, 0, 0);
      
      if (paymentDate < invoiceDate) {
        newErrors.transactionDate = `Transaction date cannot be earlier than invoice date (${formatDate(purchaseInvoice.invoiceDate)})`;
      }
    }

    // Payable account validation
    if (!payableAccountId) {
      if (paymentMethodType === 'deposit_account') {
        newErrors.payableAccountId = 'Payable account is required for account balance payments. Please select an account or configure a linked account for account balance.';
      } else {
        newErrors.payableAccountId = 'Payable account is required';
      }
    }

    // Clear all errors and set only new ones (don't merge with old errors)
    // This ensures we only show current validation errors
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate entire form (for final submission)
  const validateForm = (): boolean => {
    if (currentStep === 2) {
      return validateStep2();
    }
    return validateStep1();
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        // Errors will be cleared by useEffect when currentStep changes
        setCurrentStep(2);
      } else {
        toast.error('Please fix the errors before proceeding');
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      // Errors will be cleared by useEffect when currentStep changes
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use calculated payment amount from items + deposit if on step 2
    const finalPaymentAmount = currentStep === 2 ? totalPaymentAmount : paymentAmount;
    
    // Set payment amount to calculated value for validation
    if (currentStep === 2) {
      setPaymentAmount(finalPaymentAmount);
    }

    if (!validateForm()) {
      return;
    }

    const paymentData: InvoicePaymentData = {
      paymentAmount: finalPaymentAmount,
      paymentTypeId: paymentMethodType === 'payment_type' ? paymentTypeId : undefined,
      useVendorDeposit: paymentMethodType === 'deposit_account' || undefined,
      depositAmount: paymentMethodType === 'deposit_account' ? calculatedPaymentAmount : undefined,
      // Always include itemPayments when on step 2, even if empty (backend will handle allocation)
      itemPayments: currentStep === 2 ? itemPayments : undefined,
      chequeNumber: chequeNumber || undefined,
      bankDetailId: bankDetailId || undefined,
      branch: branch || undefined,
      currencyId,
      exchangeRate,
      exchangeRateId: exchangeRateId || undefined,
      description: description || undefined,
      transactionDate,
      payableAccountId: payableAccountId || undefined
    };

    try {
      await onSubmit(paymentData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const currentBalance = purchaseInvoice.balanceAmount || purchaseInvoice.totalAmount;
  const currencySymbol = purchaseInvoice.currencySymbol || '';

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="bg-white border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Invoice Payment Details
              </span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Invoice Payment Items Details
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Invoice Payment Details */}
        {currentStep === 1 && (
          <>
            {/* Invoice Summary and Vendor Details - Only shown on Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoice Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium">{purchaseInvoice.invoiceRefNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="font-medium">{formatDate(purchaseInvoice.invoiceDate)}</span>
                  </div>
                  {purchaseInvoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(purchaseInvoice.dueDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(purchaseInvoice.totalAmount, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-medium">{formatCurrency(purchaseInvoice.paidAmount || 0, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium text-red-600">{formatCurrency(currentBalance, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Vendor Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendor Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor Name:</span>
                    <span className="font-medium">{purchaseInvoice.vendorName || 'N/A'}</span>
                  </div>
                  {purchaseInvoice.vendorCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor Code:</span>
                      <span className="font-medium">{purchaseInvoice.vendorCode}</span>
                    </div>
                  )}
                  {purchaseInvoice.vendorPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{purchaseInvoice.vendorPhone}</span>
                    </div>
                  )}
                  {purchaseInvoice.vendorEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{purchaseInvoice.vendorEmail}</span>
                    </div>
                  )}
                  {purchaseInvoice.vendorAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">{purchaseInvoice.vendorAddress}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Balance:</span>
                      <span className={`font-medium ${(purchaseInvoice.vendor?.account_balance || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(purchaseInvoice.vendor?.account_balance || 0, currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Balance:</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(purchaseInvoice.vendor?.deposit_balance || 0, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Invoice Payment Details</h3>
              </div>
            </div>
        {/* Payment Amount - Display only, calculated from items on step 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount
          </label>
           <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
             {currentStep === 1 
               ? formatCurrency(0, currencySymbol)
               : formatCurrency(totalPaymentAmount, currencySymbol)
             }
           </div>
         </div>

        {/* Balance After Payment */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Balance After Payment:</span>
            <span className={`text-lg font-semibold ${balanceAfterPayment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {currentStep === 1 
                ? formatCurrency(currentBalance, currencySymbol)
                : formatCurrency(balanceAfterPayment, currencySymbol)
              }
            </span>
          </div>
        </div>

         {/* Payment Method Selection */}
         <div className="space-y-4">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Payment Method <span className="text-red-500">*</span>
           </label>
           
           {/* Payment Type Option */}
           <div className="flex items-start space-x-3">
             <input
               type="radio"
               id="payment_type"
               name="paymentMethod"
               checked={paymentMethodType === 'payment_type'}
               onChange={() => handlePaymentMethodTypeChange('payment_type')}
               className="mt-1"
             />
             <div className="flex-1">
               <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700 cursor-pointer">
                 Payment Type
               </label>
               {paymentMethodType === 'payment_type' && (
                 <div className="mt-2">
                   <SearchableDropdown
                     options={paymentTypeOptions}
                     value={paymentTypeId}
                     onChange={handlePaymentTypeChange}
                     placeholder="Select payment type"
                     className={errors.paymentTypeId ? 'border-red-500' : ''}
                   />
                   {errors.paymentTypeId && (
                     <p className="mt-1 text-sm text-red-600">{errors.paymentTypeId}</p>
                   )}
                 </div>
               )}
             </div>
           </div>

           {/* Account Balance Option */}
           {vendorDepositBalance > 0 && (
             <div className="flex items-start space-x-3">
               <input
                 type="radio"
                 id="deposit_account"
                 name="paymentMethod"
                 checked={paymentMethodType === 'deposit_account'}
                 onChange={() => handlePaymentMethodTypeChange('deposit_account')}
                 className="mt-1"
               />
               <div className="flex-1">
                 <label htmlFor="deposit_account" className="block text-sm font-medium text-gray-700 cursor-pointer">
                   Account Balance <span className="text-gray-500 text-xs">
                     (Available: {formatCurrency(vendorDepositBalance, defaultCurrency?.symbol || '')} {defaultCurrency?.symbol || 'System'}
                     {exchangeRate !== 1.0 && ` = ${formatCurrency(vendorDepositBalance / exchangeRate, currencySymbol)} ${currencySymbol}`})
                   </span>
                 </label>
               </div>
             </div>
           )}

           {/* Loyalty Card Option - Removed for purchase invoices */}
         </div>

         {/* Cheque Number (conditional) - only show for payment types */}
         {paymentMethodType === 'payment_type' && selectedPaymentType?.paymentMethod?.requiresChequeNumber && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cheque Number {selectedPaymentType?.paymentMethod?.requiresChequeNumber && <span className="text-red-500">*</span>}
            </label>
            <Input
              type="text"
              value={chequeNumber}
              onChange={(e) => {
                setChequeNumber(e.target.value);
                if (errors.chequeNumber) {
                  setErrors(prev => ({ ...prev, chequeNumber: '' }));
                }
              }}
              placeholder="Enter cheque number"
              className={errors.chequeNumber ? 'border-red-500' : ''}
            />
            {errors.chequeNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.chequeNumber}</p>
            )}
          </div>
        )}

         {/* Bank Details (conditional) - only show for payment types */}
         {paymentMethodType === 'payment_type' && selectedPaymentType?.paymentMethod?.requiresBankDetails && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={bankDetailOptions}
                value={bankDetailId}
                onChange={handleBankDetailChange}
                placeholder="Select bank"
                className={errors.bankDetailId ? 'border-red-500' : ''}
              />
              {errors.bankDetailId && (
                <p className="mt-1 text-sm text-red-600">{errors.bankDetailId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <Input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Enter branch"
              />
            </div>
          </>
        )}

        {/* Currency - Hidden when using Account Balance */}
            {paymentMethodType !== 'deposit_account' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-500">(Must match invoice currency)</span>
          </label>
          <SearchableDropdown
            options={currencyOptions}
            value={currencyId}
            onChange={(value) => {
                    // Validate that selected currency matches invoice currency
                    if (value && value !== purchaseInvoice.currencyId) {
                      const currencyName = purchaseInvoice.currency?.code || purchaseInvoice.currency?.name || purchaseInvoice.currencySymbol || 'invoice currency';
                      toast.error(`Payment currency must match invoice currency (${currencyName})`);
                      return; // Don't update if currency doesn't match
                    }
              setCurrencyId(value);
              if (errors.currencyId) {
                setErrors(prev => ({ ...prev, currencyId: '' }));
              }
            }}
            placeholder="Select currency"
            className={errors.currencyId ? 'border-red-500' : ''}
                  disabled={true} // Lock currency to invoice currency
          />
                <p className="mt-1 text-xs text-gray-500">
                  Payment must be in invoice currency: {purchaseInvoice.currency?.code || purchaseInvoice.currency?.name || purchaseInvoice.currencySymbol || 'N/A'}
                </p>
          {errors.currencyId && (
            <p className="mt-1 text-sm text-red-600">{errors.currencyId}</p>
          )}
        </div>
            )}

        {/* Exchange Rate - Hidden when using Account Balance */}
        {paymentMethodType !== 'deposit_account' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exchange Rate <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.000001"
            min="0"
            value={exchangeRate}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setExchangeRate(value);
              if (errors.exchangeRate) {
                setErrors(prev => ({ ...prev, exchangeRate: '' }));
              }
            }}
            placeholder="Enter exchange rate"
            className={errors.exchangeRate ? 'border-red-500' : ''}
          />
          {errors.exchangeRate && (
            <p className="mt-1 text-sm text-red-600">{errors.exchangeRate}</p>
          )}
          {paymentAmount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Equivalent Amount: {formatCurrency(equivalentAmount, defaultCurrency?.symbol || '')}
            </p>
          )}
        </div>
        )}

        {/* Transaction Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={transactionDate}
            min={purchaseInvoice.invoiceDate ? new Date(purchaseInvoice.invoiceDate).toISOString().split('T')[0] : undefined}
            onChange={(e) => {
              const newDate = e.target.value;
              setTransactionDate(newDate);
              
              // Validate immediately when date changes
              if (newDate && purchaseInvoice.invoiceDate) {
                const invoiceDate = new Date(purchaseInvoice.invoiceDate);
                const paymentDate = new Date(newDate);
                invoiceDate.setHours(0, 0, 0, 0);
                paymentDate.setHours(0, 0, 0, 0);
                
                if (paymentDate < invoiceDate) {
                  setErrors(prev => ({ 
                    ...prev, 
                    transactionDate: `Transaction date cannot be earlier than invoice date (${formatDate(purchaseInvoice.invoiceDate)})` 
                  }));
                } else if (errors.transactionDate) {
                  setErrors(prev => ({ ...prev, transactionDate: '' }));
                }
              } else if (errors.transactionDate) {
                setErrors(prev => ({ ...prev, transactionDate: '' }));
              }
            }}
            className={errors.transactionDate ? 'border-red-500' : ''}
          />
          {errors.transactionDate && (
            <p className="mt-1 text-sm text-red-600">{errors.transactionDate}</p>
          )}
        </div>

            {/* Receivable Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receivable Account <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={accountOptions}
                value={payableAccountId}
                onChange={(value) => {
                  const accountValue = value || '';
                  setPayableAccountId(accountValue);
                  // Clear error immediately when account is selected
                  setErrors(prev => {
                    const updated = { ...prev };
                    if (accountValue && updated.payableAccountId) {
                      delete updated.payableAccountId;
                    }
                    return updated;
                  });
                }}
                placeholder="Select receivable account"
                className={errors.payableAccountId ? 'border-red-500' : ''}
              />
              {errors.payableAccountId && (
                <p className="mt-1 text-sm text-red-600">{errors.payableAccountId}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter payment description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          </>
        )}

        {/* Step 2: Invoice Payment Items Details */}
        {currentStep === 2 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {errors.itemPayments && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.itemPayments}</p>
              </div>
            )}
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Invoice Payment Items Details</h3>
              </div>
            </div>

            {/* Invoice Items Table */}
            {purchaseInvoice.items && purchaseInvoice.items.length > 0 ? (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newItemPayments: Record<string, number> = {};
                      purchaseInvoice.items.forEach((item: any, index: number) => {
                        const itemKey = item.id || `item-${index}`;
                        const itemTotal = item.lineTotal || item.totalAmount || 0;
                        const itemPaidSoFar = purchaseInvoice.itemPaidAmounts?.[item.id] || 0;
                        const remaining = Math.max(0, itemTotal - itemPaidSoFar);
                        newItemPayments[itemKey] = remaining;
                      });
                      setItemPayments(newItemPayments);
                    }}
                    className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Pay All Items
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemPayments({});
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Item Total</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseInvoice.items.map((item: any, index: number) => {
                      const itemKey = item.id || `item-${index}`;
                      const itemTotal = item.lineTotal || item.totalAmount || 0;
                      // Get already paid amount for this item (cumulative from all previous payments)
                      const itemPaidSoFar = purchaseInvoice.itemPaidAmounts?.[item.id] || 0;
                      const itemPayment = itemPayments[itemKey] || 0;
                      // Remaining balance before current payment (used for max validation and disabling input)
                      const itemRemainingBeforePayment = Math.max(0, itemTotal - itemPaidSoFar);
                      // Remaining after current payment (for display)
                      const itemRemaining = Math.max(0, itemRemainingBeforePayment - itemPayment);
                      
                      return (
                        <tr key={itemKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.productName || item.product?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unitPrice || 0, currencySymbol)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.discountAmount ? formatCurrency(item.discountAmount, currencySymbol) : 
                             item.discountPercentage ? `${item.discountPercentage.toFixed(2)}%` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {item.taxAmount ? formatCurrency(item.taxAmount, currencySymbol) : 
                             item.taxPercentage ? `${item.taxPercentage.toFixed(2)}%` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(itemTotal, currencySymbol)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                            <span className={itemPaidSoFar > 0 ? 'text-blue-600' : 'text-gray-500'}>
                              {formatCurrency(itemPaidSoFar, currencySymbol)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {itemRemainingBeforePayment > 0 ? (
                              <>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                                  max={itemRemainingBeforePayment}
                              value={itemPayment}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                    const clampedValue = Math.min(Math.max(0, value), itemRemainingBeforePayment);
                                setItemPayments(prev => ({
                                  ...prev,
                                  [itemKey]: clampedValue
                                }));
                                // Clear errors when user starts typing
                                if (errors[`itemPayment_${itemKey}`]) {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors[`itemPayment_${itemKey}`];
                                    return newErrors;
                                  });
                                }
                              }}
                              placeholder="0.00"
                                  className={`w-32 text-right ${itemPayment > itemRemainingBeforePayment ? 'border-red-500' : ''}`}
                            />
                                {itemPayment > itemRemainingBeforePayment && (
                                  <p className="mt-1 text-xs text-red-600">Exceeds remaining balance</p>
                                )}
                              </>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="0"
                                value="0.00"
                                disabled
                                className="w-32 text-right bg-gray-100 cursor-not-allowed"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                            <span className={itemRemaining > 0 ? 'text-orange-600' : 'text-green-600'}>
                              {formatCurrency(itemRemaining, currencySymbol)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Invoice Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(purchaseInvoice.totalAmount, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(purchaseInvoice.paidAmount || 0, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                        {formatCurrency(calculatedPaymentAmount, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(balanceAfterPayment, currencySymbol)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>

                {/* Account Balance Info */}
                {paymentMethodType === 'deposit_account' && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Account Balance Available */}
                      <div className="bg-white rounded p-3 border border-blue-100">
                        <div className="text-xs font-medium text-gray-600 mb-1">Account Balance Available (System Currency):</div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium text-blue-600">
                            {formatCurrency(vendorDepositBalance, defaultCurrency?.symbol || '')} ({defaultCurrency?.symbol || 'System'})
                          </span>
                        </div>
                        {exchangeRate !== 1.0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            = {formatCurrency(vendorDepositBalance / exchangeRate, currencySymbol)} ({currencySymbol})
                          </div>
                        )}
                      </div>

                      {/* Payment Amount Validation */}
                      {calculatedPaymentAmount > 0 && (
                        <div className="bg-white rounded p-3 border border-blue-100">
                          <div className="text-xs font-medium text-gray-600 mb-1">Payment Amount:</div>
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{formatCurrency(calculatedPaymentAmount, currencySymbol)} ({currencySymbol})</span>
                            {exchangeRate !== 1.0 && (
                              <span className="text-gray-500 ml-2">
                                = {formatCurrency(calculatedPaymentAmount * exchangeRate, defaultCurrency?.symbol || '')} ({defaultCurrency?.symbol || 'System'})
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                      {/* Warning if exceeds balance */}
                      {calculatedPaymentAmount > 0 && (calculatedPaymentAmount * exchangeRate) > vendorDepositBalance && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                          <span className="font-medium">⚠️ Insufficient Balance: </span>
                          <span>
                            Payment amount ({formatCurrency(calculatedPaymentAmount * exchangeRate, defaultCurrency?.symbol || '')}) exceeds available balance ({formatCurrency(vendorDepositBalance, defaultCurrency?.symbol || '')})
                          </span>
                        </div>
                      )}
                    </div>
                    {errors.depositAmount && (
                      <p className="mt-2 text-sm text-red-600">{errors.depositAmount}</p>
                    )}
                  </div>
                )}

                {/* Vendor Deposit Balance Display */}
                    {paymentMethodType === 'deposit_account' && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Vendor Deposit Balance */}
                      <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                        <span className="text-sm font-semibold text-gray-700">Vendor Deposit Balance:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(vendorDepositBalance / exchangeRate, currencySymbol)} ({currencySymbol})
                        </span>
                      </div>

                      {/* Available Balance Information */}
                      <div className="bg-white rounded p-3 border border-blue-100">
                        <div className="text-xs font-medium text-gray-600 mb-1">Available Balance:</div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium text-blue-600">
                            {formatCurrency(vendorDepositBalance / exchangeRate, currencySymbol)} ({currencySymbol})
                          </span>
                        </div>
                        {exchangeRate !== 1.0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            System Currency: {formatCurrency(vendorDepositBalance, defaultCurrency?.symbol || '')} ({defaultCurrency?.symbol || 'System'})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items found for this invoice.</p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                 {paymentMethodType === 'payment_type' && calculatedPaymentAmount > 0 && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">Payment from Items:</span>
                     <span className="font-medium text-blue-600">{formatCurrency(calculatedPaymentAmount, currencySymbol)}</span>
                   </div>
                 )}
                 {paymentMethodType === 'deposit_account' && calculatedPaymentAmount > 0 && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">Payment from Account Balance:</span>
                     <span className="font-medium text-purple-600">{formatCurrency(calculatedPaymentAmount, currencySymbol)}</span>
                   </div>
                 )}
                 <div className="flex justify-between border-t border-gray-300 pt-2">
                   <span className="text-gray-600 font-semibold">Total Payment Amount:</span>
                   <span className="font-bold text-blue-600">{formatCurrency(totalPaymentAmount, currencySymbol)}</span>
                 </div>
                 {errors.paymentAmount && (
                   <div className="text-red-600 text-xs mt-1">{errors.paymentAmount}</div>
                 )}
                 {errors.depositAmount && (
                   <div className="text-red-600 text-xs mt-1">{errors.depositAmount}</div>
                 )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance After Payment:</span>
                  <span className={`font-medium ${balanceAfterPayment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(balanceAfterPayment, currencySymbol)}
                  </span>
                </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">Payment Method:</span>
                   <span className="font-medium">
                     {paymentMethodType === 'deposit_account' 
                       ? 'Account Balance' 
                       : (selectedPaymentType?.name || 'Not selected')}
                   </span>
                 </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Date:</span>
                  <span className="font-medium">{formatDate(transactionDate)}</span>
                </div>
                 {totalPaymentAmount > 0 && defaultCurrency && (
                   <div className="flex justify-between">
                     <span className="text-gray-600">Equivalent Amount:</span>
                     <span className="font-medium">{formatCurrency(equivalentAmount, defaultCurrency.symbol)}</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Record Payment'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseInvoicePaymentForm;

