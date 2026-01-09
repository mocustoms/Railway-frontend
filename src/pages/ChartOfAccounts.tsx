import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, ArrowLeft, Eye, Edit, Trash2, ChevronDown, ChevronRight, Network, FileSpreadsheet, FileText } from 'lucide-react';
import { useChartOfAccountsManagement } from '../hooks/useChartOfAccountsManagement';
import AccountForm from '../components/AccountForm';
import TreeView from '../components/TreeView';
import ContentContainer from '../components/ContentContainer';
import { Account } from '../types';
import { accountTypeRanges, accountTypeIcons, accountTypeDescriptions } from '../data/chartOfAccountsModules';
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import './ChartOfAccounts.css';

const ChartOfAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const {
    accounts,
    accountTypes,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    searchTerm,
    expandedNodes,
    filteredAccounts,
    loadAccounts,
    loadAccountTypes,
    createAccount,
    updateAccount,
    deleteAccount,
    setSearchTerm,
    toggleExpandedNode,
    expandAllNodes,
    collapseAllNodes,
    exportToExcel,
    exportToPDF,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    findAccountById
  } = useChartOfAccountsManagement();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [parentId, setParentId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | null>(null);
  const [selectedAccountTypeId, setSelectedAccountTypeId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadAccounts();
    loadAccountTypes();
  }, [loadAccounts, loadAccountTypes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(debouncedSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Get available parent accounts for dropdown
  const availableParents = useMemo(() => {
    const parents: { id: string; name: string; level: number; type: string; accountTypeId?: string }[] = [];
    
    function traverse(nodes: Account[], level: number = 0) {
      for (const node of nodes) {
        if (editingAccount && node.id === editingAccount.id) continue; // Exclude self
        
        // Include Account Type nodes as potential parents
        // Include ALL Account Type nodes - filtering by Type will be done in AccountForm
        if (node.isAccountType) {
          parents.push({ 
            id: node.id, 
            name: node.name, 
            level: 0, // Account Types are always level 0
            type: node.type,
            accountTypeId: node.accountTypeId
          });
        } else {
          // Regular account nodes - include all of them
          parents.push({ 
            id: node.id, 
            name: node.name, 
            level,
            type: node.type,
            accountTypeId: node.accountTypeId
          });
        }
        
        if (node.children) {
          traverse(node.children, level + 1);
        }
      }
    }
    
    traverse(accounts);
    return parents;
  }, [accounts, editingAccount]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
      } else {
        await createAccount(data);
      }
      setShowForm(false);
      setEditingAccount(null);
      setParentId(null);
      setAccountType(null);
      setSelectedAccountTypeId(null);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [editingAccount, createAccount, updateAccount, selectedAccountTypeId, accountType]);

  // Handle edit
  const handleEdit = useCallback((account: Account) => {
    setEditingAccount(account);
    setSelectedAccountTypeId(null);
    setShowForm(true);
  }, []);

  // Handle view
  const handleView = useCallback((account: Account) => {
    setViewingAccount(account);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (account: Account) => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: `Are you sure you want to delete "${account.name}" and all its children? This action cannot be undone.`,
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) { return; }
    try {
      await deleteAccount(account.id);
    } catch (error) {
      // Error is already handled by the hook with toast notifications
    }
  }, [deleteAccount, confirm]);

  // Handle add child
  const handleAddChild = useCallback((account: Account) => {
    setParentId(account.id);
    setAccountType(account.type);
    setEditingAccount(null);
    // Auto-select the account type from the parent account
    setSelectedAccountTypeId(account.accountTypeId || null);
    setShowForm(true);
  }, []);

  // Handle add to type
  const handleAddToType = useCallback((accountTypeId: string) => {
    // Find the account type by ID
    const accountType = accountTypes.find(at => at.id === accountTypeId);
    
    if (accountType) {
      setAccountType(accountType.category as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE');
      // Find the Account Type node in the tree and set it as parent
      const accountTypeNode = accounts.find(acc => acc.isAccountType && acc.accountTypeId === accountTypeId);
      if (accountTypeNode) {
        setParentId(accountTypeNode.id); // Set the Account Type node as parent
      } else {
        setParentId(null); // Fallback to null if node not found
      }
      setEditingAccount(null);
      setShowForm(true);
      // Store the accountTypeId for the form
      setSelectedAccountTypeId(accountType.id);
    } else {
      toast.error(`No account type found. Please ensure account types are loaded.`);
    }
  }, [accountTypes, accounts]);

  // Handle add root
  const handleAddRoot = useCallback(() => {
    setParentId(null);
    setAccountType(null);
    setEditingAccount(null);
    setSelectedAccountTypeId(null);
    setShowForm(true);
  }, []);

  // Toggle expand all
  const handleToggleExpandAll = useCallback(() => {
    if (expandedNodes.size > 0) {
      collapseAllNodes();
    } else {
      expandAllNodes();
    }
  }, [expandedNodes.size, expandAllNodes, collapseAllNodes]);

  // Get account type icon
  const getAccountTypeIcon = useCallback((type: string) => {
    const iconName = accountTypeIcons[type as keyof typeof accountTypeIcons];
    return iconName || 'LayerGroup';
  }, []);

  // Get account type color
  const getAccountTypeColor = useCallback((type: string) => {
    const range = accountTypeRanges[type as keyof typeof accountTypeRanges];
    return range?.color || '#6b7280';
  }, []);

  // Export functions
  const handleExportExcel = useCallback(() => {
    exportToExcel();
  }, [exportToExcel]);

  const handleExportPdf = useCallback(() => {
    exportToPDF();
  }, [exportToPDF]);

  // Highlight search terms function
  const highlightSearchTerm = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Main Content */}
      <ContentContainer>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInUp hover:shadow-md transition-all duration-150 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search accounts by name, code, type, or status..."
              value={debouncedSearchTerm}
              onChange={(e) => setDebouncedSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 hover:border-gray-400"
            />
            {debouncedSearchTerm && (
              <button
                onClick={() => setDebouncedSearchTerm('')}
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
                onClick={() => navigate('/app-accounts/accounts')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Accounts
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleExpandAll}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-all duration-100 transform hover:scale-105 ${
                  expandedNodes.size > 0
                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                }`}
              >
                {expandedNodes.size > 0 ? (
                  <>
                    <ChevronDown size={16} className="mr-2" />
                    Collapse All
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} className="mr-2" />
                    Expand All
                  </>
                )}
              </button>
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
            </div>
          </div>
        </div>

        {/* Enhanced Chart of Accounts Tree Container */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 animate-slideInUp hover:shadow-lg transition-all duration-150">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 animate-pulse">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading chart of accounts...</span>
            </div>
          ) : hasData ? (
            <div className="accounts-tree-container">
              <TreeView
                nodes={filteredAccounts}
                expandedNodes={expandedNodes}
                searchTerm={searchTerm}
                onToggleNode={toggleExpandedNode}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onAddToType={handleAddToType}
                canUpdate={canUpdate}
                canDelete={canDelete}
                isDeleting={isDeleting}
                getAccountTypeColor={getAccountTypeColor}
                highlightSearchTerm={highlightSearchTerm}
              />
            </div>
          ) : (
            <div className="text-center py-16 animate-fadeIn">
              <div className="text-gray-300 mb-6 animate-bounce">
                <Network size={64} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Accounts Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first account to build your chart of accounts structure.
              </p>
              {canCreate && (
                <button
                  onClick={handleAddRoot}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-100 transform hover:scale-105"
                >
                  <Plus size={18} className="mr-2" />
                  Add Root Account
                </button>
              )}
            </div>
          )}
        </div>
      </ContentContainer>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" style={{ top: '64px' }}>
          <div className="min-h-[calc(100vh-64px)] flex items-start justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </h2>
              <AccountForm
                key={`account-form-${parentId || 'root'}-${editingAccount?.id || 'new'}`}
                account={editingAccount || undefined}
                parentId={parentId || undefined}
                accountType={accountType || undefined}
                selectedAccountTypeId={selectedAccountTypeId || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  setParentId(null);
                  setAccountType(null);
                  setSelectedAccountTypeId(null);
                }}
                isLoading={isCreating || isUpdating}
                availableParents={availableParents}
                availableAccountTypes={accountTypes}
              />
            </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
                <button
                  onClick={() => setViewingAccount(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingAccount.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{viewingAccount.code}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <span 
                      className="mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: getAccountTypeColor(viewingAccount.type) + '20', 
                        color: getAccountTypeColor(viewingAccount.type) 
                      }}
                    >
                      {viewingAccount.type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      viewingAccount.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingAccount.status}
                    </span>
                  </div>
                </div>
                
                {viewingAccount.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingAccount.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setViewingAccount(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-100 transform hover:scale-105"
                >
                  Close
                </button>
                {canUpdate && (
                  <button
                    onClick={() => {
                      setViewingAccount(null);
                      handleEdit(viewingAccount);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-all duration-100 transform hover:scale-105"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={handleAddRoot}
        className={`fab-button ${showForm || viewingAccount ? 'hidden' : ''}`}
        title="Add Root Account"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default ChartOfAccounts; 