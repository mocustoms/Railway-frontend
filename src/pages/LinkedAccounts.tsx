import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Save, X, ArrowLeft, Loader2 } from 'lucide-react';
import { linkedAccountService, LinkedAccount } from '../services/linkedAccountService';
import { accountService } from '../services/accountService';
import customerService from '../services/customerService';
import { Customer } from '../services/customerService';
import SearchableDropdown from '../components/SearchableDropdown';
import toast from 'react-hot-toast';
import ContentContainer from '../components/ContentContainer';

const LinkedAccounts: React.FC = () => {
  const navigate = useNavigate();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; code: string; name: string; type: string }>>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load linked accounts, accounts, and customers
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [linkedAccountsData, accountsData, customersData] = await Promise.all([
          linkedAccountService.getLinkedAccounts(),
          accountService.getLeafAccounts(),
          customerService.getCustomers({ page: 1, limit: 1000, status: 'active' })
        ]);
        
        setLinkedAccounts(linkedAccountsData);
        setAccounts(accountsData.map(acc => ({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          type: acc.type || ''
        })));
        setCustomers(customersData.data || []);
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to load linked accounts');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle account selection change
  const handleAccountChange = useCallback((accountType: string, accountId: string | null) => {
    setLinkedAccounts(prev => 
      prev.map(la => 
        la.accountType === accountType 
          ? { ...la, accountId, account: accountId ? accounts.find(a => a.id === accountId) || null : null }
          : la
      )
    );
    setHasChanges(true);
  }, [accounts]);

  // Handle customer selection change (for cash_customer type)
  const handleCustomerChange = useCallback((accountType: string, customerId: string | null) => {
    setLinkedAccounts(prev => 
      prev.map(la => 
        la.accountType === accountType 
          ? { 
              ...la, 
              customerId, 
              customer: customerId ? customers.find(c => c.id === customerId) || null : null 
            }
          : la
      )
    );
    setHasChanges(true);
  }, [customers]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const updates = linkedAccounts.map(la => ({
        accountType: la.accountType,
        accountId: la.accountType === 'cash_customer' ? null : (la.accountId || null),
        customerId: la.accountType === 'cash_customer' ? (la.customerId || null) : null
      }));

      await linkedAccountService.updateLinkedAccounts(updates);
      
      toast.success('Linked accounts saved successfully');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save linked accounts');
    } finally {
      setIsSaving(false);
    }
  }, [linkedAccounts]);

  // Handle close/back
  const handleBack = useCallback(() => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/accounts');
      }
    } else {
      navigate('/accounts');
    }
  }, [hasChanges, navigate]);

  // Prepare account options for dropdowns
  const accountOptions = accounts.map(account => ({
    id: account.id,
    value: account.id,
    label: `<<${account.code}>> ${account.name}`,
    code: account.code,
    name: account.name,
    type: account.type
  }));

  // Prepare customer options for dropdowns
  const customerOptions = customers.map(customer => ({
    id: customer.id,
    value: customer.id,
    label: `${customer.customer_id ? `[${customer.customer_id}] ` : ''}${customer.full_name}`,
    code: customer.customer_id || '',
    name: customer.full_name
  }));

  if (isLoading) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading linked accounts...</span>
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Accounts
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Link2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Linked Accounts</h1>
          </div>
          <p className="text-gray-600">Link accounts to different transaction types and modules</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {linkedAccounts.map((linkedAccount) => {
              // Get receivables account for cash customer info
              const receivablesAccount = linkedAccount.accountType === 'cash_customer' 
                ? linkedAccounts.find(la => la.accountType === 'receivables' && la.accountId)
                : null;

              return (
                <div key={linkedAccount.accountType} className="py-3 border-b border-gray-100 last:border-b-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 w-full">
                        {linkedAccount.accountTypeLabel}
                      </label>
                    </div>
                    <div>
                      {linkedAccount.accountType === 'cash_customer' ? (
                        <div className="space-y-2">
                          <SearchableDropdown
                            options={customerOptions}
                            value={linkedAccount.customerId || ''}
                            onChange={(value) => handleCustomerChange(linkedAccount.accountType, value || null)}
                            placeholder="Select customer..."
                            searchPlaceholder="Search customers by ID or name..."
                            disabled={isSaving}
                            className="w-full"
                          />
                          {receivablesAccount?.account ? (
                            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                              <span className="font-medium">Account Receivable:</span>{' '}
                              {receivablesAccount.account.code} - {receivablesAccount.account.name}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              ⚠️ Please configure "Receivables" account above to set the default receivable account for this cash customer.
                            </div>
                          )}
                        </div>
                      ) : (
                        <SearchableDropdown
                          options={accountOptions}
                          value={linkedAccount.accountId || ''}
                          onChange={(value) => handleAccountChange(linkedAccount.accountType, value || null)}
                          placeholder="Select account..."
                          searchPlaceholder="Search accounts by code or name..."
                          disabled={isSaving}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="h-4 w-4 inline mr-2" />
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
};

export default LinkedAccounts;

