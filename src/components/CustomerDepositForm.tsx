import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import Input from './Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import SearchableDropdown from './SearchableDropdown';
import { 
  defaultCustomerDepositFormData, 
  customerDepositErrorMessages 
} from '../data/customerDepositModules';
import { CustomerDepositFormData, PaymentType, BankDetail, CustomerDeposit } from '../types';
import { X, Save, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { customerDepositService } from '../services/customerDepositService';
import customerService from '../services/customerService';
import { getAllActiveExchangeRates } from '../services/exchangeRateService';
import { financialYearService } from '../services/financialYearService';

interface CustomerDepositFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerDepositFormData) => void;
  customerDeposit?: CustomerDeposit | null;
  isSubmitting?: boolean;
}

export const CustomerDepositForm: React.FC<CustomerDepositFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerDeposit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CustomerDepositFormData>(defaultCustomerDepositFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDepositFormData, string>>>({});
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);
  const [selectedBankDetail, setSelectedBankDetail] = useState<BankDetail | null>(null);
  const [financialYear, setFinancialYear] = useState<{ startDate: string; endDate: string } | null>(null);

  // Fetch data for dropdowns
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customerService.getCustomers({ limit: 2000, status: 'active' }),
    enabled: isOpen
  });


  const { data: paymentTypes = [] } = useQuery({
    queryKey: ['payment-types'],
    queryFn: customerDepositService.getPaymentTypes,
    enabled: isOpen
  });

  const { data: bankDetails = [] } = useQuery({
    queryKey: ['bank-details'],
    queryFn: customerDepositService.getBankDetails,
    enabled: isOpen
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['customer-deposit-currencies'],
    queryFn: customerDepositService.getCurrencies,
    enabled: isOpen
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['leaf-accounts'],
    queryFn: customerDepositService.getLeafAccounts,
    enabled: isOpen
  });

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: getAllActiveExchangeRates,
    enabled: isOpen
  });

  // Get default currency
  const defaultCurrency = useMemo(() => {
    if (!Array.isArray(currencies)) return null;
    return currencies.find(currency => currency.is_default);
  }, [currencies]);

  // Prepare options for dropdowns
  const customerOptions = useMemo(() => {
    const customers = customersResponse?.data || [];
    return customers.map(customer => ({
      id: customer.id,
      value: customer.id,
      label: `${customer.customer_id} - ${customer.full_name}`,
      customer_id: customer.customer_id,
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      email: customer.email,
      account_balance: 0 // Default value since customer service doesn't include account_balance
    }));
  }, [customersResponse?.data]);

  // Filter payment types to only show those enabled for customer deposits
  const paymentTypeOptions = useMemo(() => {
    if (!Array.isArray(paymentTypes)) return [];
    return paymentTypes
      .filter(paymentType => paymentType.used_in_customer_deposits && paymentType.is_active)
      .map(paymentType => ({
        id: paymentType.id,
        value: paymentType.id,
        label: paymentType.name, // Only show the name
        name: paymentType.name,
        code: paymentType.code,
        paymentMethod: paymentType.paymentMethod
      }));
  }, [paymentTypes]);

  const bankDetailOptions = useMemo(() => {
    if (!Array.isArray(bankDetails)) return [];
    return bankDetails.map(bank => ({
      id: bank.id,
      value: bank.id,
      label: `${bank.bankName} - ${bank.branch}`,
      bankName: bank.bankName,
      branch: bank.branch,
      accountNumber: bank.accountNumber
    }));
  }, [bankDetails]);

  const currencyOptions = useMemo(() => {
    if (!Array.isArray(currencies)) return [];
    return currencies.map(currency => ({
      id: currency.id,
      value: currency.id,
      label: `${currency.code} - ${currency.name}`,
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol
    }));
  }, [currencies]);

  const accountOptions = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    return accounts.map(account => ({
      id: account.id,
      value: account.id,
      label: `${account.code} - ${account.name}`,
      code: account.code,
      name: account.name,
      type: account.type
    }));
  }, [accounts]);

  // Load current financial year
  useEffect(() => {
    const loadFinancialYear = async () => {
      try {
        const currentYear = await financialYearService.getCurrentFinancialYear();
        if (currentYear) {
          setFinancialYear({
            startDate: currentYear.startDate,
            endDate: currentYear.endDate
          });
        }
      } catch (error) {
        // Failed to load financial year
      }
    };
    if (isOpen) {
      loadFinancialYear();
    }
  }, [isOpen]);

  // Initialize form data when customerDeposit changes or when form opens
  useEffect(() => {
    if (customerDeposit) {
      setFormData({
        customerId: customerDeposit.customerId,
        paymentTypeId: customerDeposit.paymentTypeId,
        chequeNumber: customerDeposit.chequeNumber || '',
        bankDetailId: customerDeposit.bankDetailId || '',
        branch: customerDeposit.branch || '',
        currencyId: customerDeposit.currencyId,
        exchangeRate: customerDeposit.exchangeRate || 1.0,
        exchangeRateId: customerDeposit.exchangeRateId || '',
        documentPath: customerDeposit.documentPath || '',
        document: undefined, // File will be handled separately
        depositAmount: customerDeposit.depositAmount,
        equivalentAmount: customerDeposit.equivalentAmount || 0,
        description: customerDeposit.description || '',
        liabilityAccountId: customerDeposit.liabilityAccountId,
        assetAccountId: customerDeposit.assetAccountId,
        transactionDate: customerDeposit.transactionDate.split('T')[0]
      });
    } else if (isOpen) {
      // Reset form to default when opening for new deposit
      setFormData(defaultCustomerDepositFormData);
    }
    setErrors({});
  }, [customerDeposit, isOpen]);

  // Set selected payment type when paymentTypes are loaded and customerDeposit exists
  useEffect(() => {
    if (customerDeposit && paymentTypes.length > 0) {
      const paymentType = paymentTypes.find(pt => pt.id === customerDeposit.paymentTypeId);
      setSelectedPaymentType(paymentType || null);
    } else if (!customerDeposit) {
      setSelectedPaymentType(null);
    }
  }, [customerDeposit, paymentTypes]);

  // Set default currency when currencies are loaded and we're creating a new deposit
  useEffect(() => {
    if (!customerDeposit && Array.isArray(currencies) && currencies.length > 0 && !formData.currencyId) {
      const defaultCurrency = currencies.find(currency => currency.is_default);
      if (defaultCurrency) {
        setFormData(prev => ({
          ...prev,
          currencyId: defaultCurrency.id
        }));
      }
    }
  }, [currencies, customerDeposit, formData.currencyId]);

  // Auto-fill exchange rate when currency changes
  useEffect(() => {
    if (formData.currencyId && defaultCurrency && exchangeRates.length > 0) {
      // If selected currency is the same as default currency, rate is 1
      if (formData.currencyId === defaultCurrency.id) {
        setFormData(prev => ({
          ...prev,
          exchangeRate: 1.0,
          exchangeRateId: ''
        }));
      } else {
        // Find exchange rate from selected currency to default currency
        const rate = exchangeRates.find(rate => 
          rate.from_currency_id === formData.currencyId && 
          rate.to_currency_id === defaultCurrency.id
        );
        
        if (rate) {
          setFormData(prev => ({
            ...prev,
            exchangeRate: rate.rate,
            exchangeRateId: rate.id
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            exchangeRate: 1.0,
            exchangeRateId: ''
          }));
        }
      }
    }
  }, [formData.currencyId, defaultCurrency, exchangeRates]);

  // Auto-select liability account when customer changes (only for new deposits)
  useEffect(() => {
    // Only auto-fill liability account for new deposits, not when editing existing ones
    if (formData.customerId && customersResponse?.data && accounts.length > 0 && !customerDeposit) {
      const selectedCustomer = customersResponse.data.find(customer => customer.id === formData.customerId);
      
      if (selectedCustomer?.default_liability_account_id) {
        // Check if the liability account exists in the accounts list
        const liabilityAccount = accounts.find(account => account.id === selectedCustomer.default_liability_account_id);
        
        if (liabilityAccount) {
          setFormData(prev => ({
            ...prev,
            liabilityAccountId: selectedCustomer.default_liability_account_id!
          }));
        }
      }
    }
  }, [formData.customerId, customersResponse?.data, accounts, customerDeposit]);

  // Handle payment type change
  const handlePaymentTypeChange = (paymentTypeId: string) => {
    const paymentType = paymentTypes.find(pt => pt.id === paymentTypeId);
    setSelectedPaymentType(paymentType || null);
    
    setFormData(prev => ({
      ...prev,
      paymentTypeId,
      // Auto-fill asset account based on payment type's default account
      ...(paymentType?.default_account && { assetAccountId: paymentType.default_account.id }),
      // Clear conditional fields when payment type changes
      chequeNumber: '',
      bankDetailId: '',
      documentPath: '',
      document: undefined
    }));
    
    // Clear selected bank detail when payment type changes
    setSelectedBankDetail(null);
  };

  // Handle bank detail change
  const handleBankDetailChange = (bankDetailId: string) => {
    const bankDetail = bankDetails.find(bd => bd.id === bankDetailId);
    setSelectedBankDetail(bankDetail || null);
    setFormData(prev => ({
      ...prev,
      bankDetailId,
      // Auto-fill branch when bank is selected
      ...(bankDetail && { branch: bankDetail.branch })
    }));
  };

  const handleInputChange = (field: keyof CustomerDepositFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate customer selection
    if (!formData.customerId) {
      newErrors.customerId = customerDepositErrorMessages.customerId.required;
    }

    // Validate payment type selection
    if (!formData.paymentTypeId) {
      newErrors.paymentTypeId = customerDepositErrorMessages.paymentTypeId.required;
    }

    // Validate currency selection
    if (!formData.currencyId) {
      newErrors.currencyId = customerDepositErrorMessages.currencyId.required;
    }

    // Validate exchange rate
    if (!formData.exchangeRate || formData.exchangeRate <= 0) {
      newErrors.exchangeRate = customerDepositErrorMessages.exchangeRate.required;
    }

    // Validate deposit amount
    if (!formData.depositAmount || formData.depositAmount <= 0) {
      newErrors.depositAmount = customerDepositErrorMessages.depositAmount.required;
    }

    // Validate liability account
    if (!formData.liabilityAccountId) {
      newErrors.liabilityAccountId = customerDepositErrorMessages.liabilityAccountId.required;
    }

    // Validate asset account
    if (!formData.assetAccountId) {
      newErrors.assetAccountId = customerDepositErrorMessages.assetAccountId.required;
    }

    // Validate transaction date
    if (!formData.transactionDate) {
      newErrors.transactionDate = customerDepositErrorMessages.transactionDate.required;
    }

    // Validate conditional fields based on payment type
    if (selectedPaymentType?.paymentMethod?.requiresBankDetails) {
      if (!formData.bankDetailId) {
        newErrors.bankDetailId = 'Bank selection is required for this payment type';
      }
    }

    // Validate cheque number if required
    if (selectedPaymentType?.paymentMethod?.requiresBankDetails && !formData.chequeNumber) {
      newErrors.chequeNumber = 'Cheque number is required for this payment type';
    }

    // Validate description length
    if (formData.description && formData.description.length > 500) {
      newErrors.description = customerDepositErrorMessages.description.maxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Calculate equivalent amount before submission
      const formDataWithEquivalent = {
        ...formData,
        equivalentAmount: formData.depositAmount * (formData.exchangeRate || 1)
      };
      await onSubmit(formDataWithEquivalent);
    } catch (error) {
      // Form submission error handled by parent component
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file object for upload
      setFormData(prev => ({ ...prev, document: file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 animate-fadeIn" style={{ top: '64px' }}>
      <div className="min-h-[calc(100vh-64px)] flex items-start justify-center py-8 px-4">
        <Card className="w-full max-w-4xl p-6 relative animate-slideInUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {customerDeposit ? 'Edit Customer Deposit' : 'Create Customer Deposit'}
        </h2>

        {isSubmitting && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                Customer *
              </label>
              <SearchableDropdown
                options={customerOptions}
                value={formData.customerId}
                onChange={(value) => handleInputChange('customerId', value)}
                placeholder="Search and select customer..."
                searchPlaceholder="Search by name, ID, phone, or email..."
                disabled={isSubmitting}
                className={errors.customerId ? 'border-red-500' : ''}
              />
              {errors.customerId && (
                <Alert variant="error" className="text-sm">
                  {errors.customerId}
                </Alert>
              )}
            </div>

            {/* Payment Type Selection */}
            <div className="space-y-2">
              <label htmlFor="paymentTypeId" className="block text-sm font-medium text-gray-700">
                Payment Type *
              </label>
              <SearchableDropdown
                options={paymentTypeOptions}
                value={formData.paymentTypeId}
                onChange={handlePaymentTypeChange}
                placeholder="Select payment type..."
                searchPlaceholder="Search payment types..."
                disabled={isSubmitting}
                className={errors.paymentTypeId ? 'border-red-500' : ''}
              />
              {errors.paymentTypeId && (
                <Alert variant="error" className="text-sm">
                  {errors.paymentTypeId}
                </Alert>
              )}
            </div>
          </div>

          {/* Conditional Fields - Cheque Number and Bank Details */}
          {selectedPaymentType?.paymentMethod?.requiresBankDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cheque Number */}
              <div className="space-y-2">
                <label htmlFor="chequeNumber" className="block text-sm font-medium text-gray-700">
                  Cheque Number *
                </label>
                <Input
                  id="chequeNumber"
                  type="text"
                  value={formData.chequeNumber}
                  onChange={(e) => handleInputChange('chequeNumber', e.target.value)}
                  disabled={isSubmitting}
                  className={errors.chequeNumber ? 'border-red-500' : ''}
                  placeholder="Enter cheque number"
                />
                {errors.chequeNumber && (
                  <Alert variant="error" className="text-sm">
                    {errors.chequeNumber}
                  </Alert>
                )}
              </div>

              {/* Bank Selection */}
              <div className="space-y-2">
                <label htmlFor="bankDetailId" className="block text-sm font-medium text-gray-700">
                  Bank *
                </label>
                <SearchableDropdown
                  options={bankDetailOptions}
                  value={formData.bankDetailId || ''}
                  onChange={handleBankDetailChange}
                  placeholder="Select bank..."
                  searchPlaceholder="Search banks..."
                  disabled={isSubmitting}
                  className={errors.bankDetailId ? 'border-red-500' : ''}
                />
                {errors.bankDetailId && (
                  <Alert variant="error" className="text-sm">
                    {errors.bankDetailId}
                  </Alert>
                )}
              </div>

              {/* Branch (Auto-filled when bank is selected) */}
              <div className="space-y-2">
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <Input
                  id="branch"
                  type="text"
                  value={formData.branch || selectedBankDetail?.branch || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  placeholder="Enter branch name"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Currency Selection */}
            <div className="space-y-2">
              <label htmlFor="currencyId" className="block text-sm font-medium text-gray-700">
                Currency *
              </label>
              <SearchableDropdown
                options={currencyOptions}
                value={formData.currencyId}
                onChange={(value) => handleInputChange('currencyId', value)}
                placeholder="Select currency..."
                searchPlaceholder="Search currencies..."
                disabled={isSubmitting}
                className={errors.currencyId ? 'border-red-500' : ''}
              />
              {errors.currencyId && (
                <Alert variant="error" className="text-sm">
                  {errors.currencyId}
                </Alert>
              )}
            </div>

            {/* Exchange Rate */}
            <div className="space-y-2">
              <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700">
                Exchange Rate *
              </label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                min="0"
                value={formData.exchangeRate || ''}
                onChange={(e) => handleInputChange('exchangeRate', parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
                className={errors.exchangeRate ? 'border-red-500' : ''}
                placeholder="Auto-filled"
              />
              {errors.exchangeRate && (
                <Alert variant="error" className="text-sm">
                  {errors.exchangeRate}
                </Alert>
              )}
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
                Transaction Date *
              </label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => handleInputChange('transactionDate', e.target.value)}
                disabled={isSubmitting}
                min={financialYear?.startDate}
                max={financialYear?.endDate}
                title={financialYear ? `Date must be between ${financialYear.startDate} and ${financialYear.endDate}` : undefined}
                className={errors.transactionDate ? 'border-red-500' : ''}
              />
              {errors.transactionDate && (
                <Alert variant="error" className="text-sm">
                  {errors.transactionDate}
                </Alert>
              )}
            </div>
          </div>

          {/* Conditional Field - Document Upload */}
          {selectedPaymentType?.paymentMethod?.uploadDocument && (
            <div className="space-y-2">
              <label htmlFor="documentPath" className="block text-sm font-medium text-gray-700">
                Upload Document *
              </label>
              <div className="flex items-center space-x-4">
                <Input
                  id="documentPath"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              {(formData.document || formData.documentPath) && (
                <p className="text-sm text-gray-600">
                  Selected: {formData.document?.name || formData.documentPath}
                </p>
              )}
            </div>
          )}

          {/* Deposit Amount and Equivalent Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deposit Amount */}
            <div className="space-y-2">
              <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">
                Deposit Amount *
              </label>
              <Input
                id="depositAmount"
                type="number"
                value={formData.depositAmount}
                onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
                className={errors.depositAmount ? 'border-red-500' : ''}
                placeholder="Enter deposit amount"
                min="0.01"
                step="0.01"
              />
              {errors.depositAmount && (
                <Alert variant="error" className="text-sm">
                  {errors.depositAmount}
                </Alert>
              )}
            </div>

            {/* Equivalent Amount (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="equivalentAmount" className="block text-sm font-medium text-gray-700">
                Equivalent Amount (System Currency)
              </label>
              <Input
                id="equivalentAmount"
                type="text"
                value={`${defaultCurrency?.symbol || '$'}${new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(formData.depositAmount * (formData.exchangeRate || 1))}`}
                disabled={true}
                className="bg-gray-50 text-gray-600"
                placeholder="Calculated automatically"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter description..."
              rows={3}
            />
            {errors.description && (
              <Alert variant="error" className="text-sm">
                {errors.description}
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Liability Account */}
            <div className="space-y-2">
              <label htmlFor="liabilityAccountId" className="block text-sm font-medium text-gray-700">
                Liability Account *
              </label>
              <SearchableDropdown
                options={accountOptions}
                value={formData.liabilityAccountId}
                onChange={(value) => handleInputChange('liabilityAccountId', value)}
                placeholder="Select liability account..."
                searchPlaceholder="Search accounts..."
                disabled={isSubmitting}
                className={errors.liabilityAccountId ? 'border-red-500' : ''}
              />
              {errors.liabilityAccountId && (
                <Alert variant="error" className="text-sm">
                  {errors.liabilityAccountId}
                </Alert>
              )}
            </div>

            {/* Asset Account */}
            <div className="space-y-2">
              <label htmlFor="assetAccountId" className="block text-sm font-medium text-gray-700">
                Asset Account *
              </label>
              <SearchableDropdown
                options={accountOptions}
                value={formData.assetAccountId}
                onChange={(value) => handleInputChange('assetAccountId', value)}
                placeholder="Select asset account..."
                searchPlaceholder="Search accounts..."
                disabled={isSubmitting}
                className={errors.assetAccountId ? 'border-red-500' : ''}
              />
              {errors.assetAccountId && (
                <Alert variant="error" className="text-sm">
                  {errors.assetAccountId}
                </Alert>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : customerDeposit ? 'Update' : 'Create'}</span>
            </Button>
          </div>
        </form>
      </Card>
      </div>
    </div>
  );
};

export default CustomerDepositForm;
