import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Account } from '../types';
import toast from 'react-hot-toast';
import { accountService, AccountFilters } from '../services/accountService';
import { accountTypeService } from '../services/accountTypeService';
import { accountTypeRanges } from '../data/chartOfAccountsModules';

interface AccountSort {
  column: string;
  direction: 'asc' | 'desc';
}

interface UseChartOfAccountsManagementReturn {
  // State
  accounts: Account[];
  accountTypes: { id: string; name: string; category: string; nature: string }[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  searchTerm: string;
  filters: AccountFilters;
  sort: AccountSort;
  expandedNodes: Set<string>;
  
  // Actions
  loadAccounts: () => Promise<void>;
  loadAccountTypes: () => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<Account | null>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<Account | null>;
  deleteAccount: (id: string) => Promise<boolean>;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: AccountFilters) => void;
  setSort: (sort: AccountSort) => void;
  toggleExpandedNode: (nodeId: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
  exportToExcel: (filters?: AccountFilters) => Promise<void>;
  exportToPDF: (filters?: AccountFilters) => Promise<void>;
  
  // Computed
  filteredAccounts: Account[];
  hasData: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  findAccountById: (id: string) => Account | null;
  findAccountByCode: (code: string) => Account | null;
}

export const useChartOfAccountsManagement = (): UseChartOfAccountsManagementReturn => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AccountFilters>({});
  const [sort, setSort] = useState<AccountSort>({ column: 'name', direction: 'asc' });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load accounts with React Query
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts-tree'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      return await accountService.getAccountsTree();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load account types with React Query
  const {
    data: accountTypesData,
    isLoading: isLoadingAccountTypes,
    error: accountTypesError
  } = useQuery({
    queryKey: ['accountTypes'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const response = await accountTypeService.getAccountTypes(1, 1000);
      return response.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Account>) => {
      return await accountService.createAccount(data);
    },
    onSuccess: () => {
      toast.success('Account created successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to create account');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Account> }) => {
      return await accountService.updateAccount(id, data);
    },
    onSuccess: () => {
      toast.success('Account updated successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to update account');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await accountService.deleteAccount(id);
      return true;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || 'Failed to delete account');
    }
  });

  // Computed values
  const accounts = accountsData || [];
  const accountTypes = accountTypesData || [];
  const isLoading = isLoadingAccounts || isLoadingAccountTypes;
  const hasData = useMemo(() => accounts.length > 0, [accounts]);

  // Permission checks - simplified JWT authentication
  const canCreate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canUpdate = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canDelete = useMemo(() => isAuthenticated, [isAuthenticated]);
  const canExport = useMemo(() => isAuthenticated, [isAuthenticated]);

  // Get all existing account codes
  const getAllAccountCodes = useCallback(() => {
    const codes: string[] = [];
    
    function traverse(nodes: Account[]) {
      for (const node of nodes) {
        if (node.code && !node.isAccountType) {
          codes.push(node.code);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    
    traverse(accounts);
    return codes;
  }, [accounts]);

  // Generate suggested account codes
  const generateSuggestedCodes = useCallback((parentId?: string, accountType?: string): string[] => {
    const existingCodes = getAllAccountCodes();
    const suggestions: string[] = [];
    
    if (parentId) {
      // Generate child account codes
      const parentAccount = findAccountById(parentId);
      if (parentAccount && parentAccount.code) {
        const parentCode = parentAccount.code;
        
        // Find the highest child code for this parent
        let maxChildCode = 0;
        existingCodes.forEach(code => {
          if (code.startsWith(parentCode) && code !== parentCode) {
            const childSuffix = code.substring(parentCode.length);
            const childNum = parseInt(childSuffix);
            if (!isNaN(childNum) && childNum > maxChildCode) {
              maxChildCode = childNum;
            }
          }
        });
        
        // Generate next available child codes
        for (let i = 1; i <= 3; i++) {
          const nextCode = parentCode + String(maxChildCode + i).padStart(2, '0');
          if (!existingCodes.includes(nextCode)) {
            suggestions.push(nextCode);
          }
        }
      }
    } else if (accountType) {
      // Generate root account codes for specific type
      const range = accountTypeRanges[accountType as keyof typeof accountTypeRanges];
      if (range) {
        // Find the highest code in this range
        let maxCode = range.start - 100;
        existingCodes.forEach(code => {
          const codeNum = parseInt(code);
          if (!isNaN(codeNum) && codeNum >= range.start && codeNum <= range.end) {
            if (codeNum > maxCode) {
              maxCode = codeNum;
            }
          }
        });
        
        // Generate next available codes in this range
        for (let i = 1; i <= 3; i++) {
          const nextCode = String(maxCode + i * 100);
          if (!existingCodes.includes(nextCode)) {
            suggestions.push(nextCode);
          }
        }
      }
    } else {
      // Generate general root account codes
      Object.entries(accountTypeRanges).forEach(([type, range]) => {
        let maxCode = range.start - 100;
        existingCodes.forEach(code => {
          const codeNum = parseInt(code);
          if (!isNaN(codeNum) && codeNum >= range.start && codeNum <= range.end) {
            if (codeNum > maxCode) {
              maxCode = codeNum;
            }
          }
        });
        
        const nextCode = String(maxCode + 100);
        if (!existingCodes.includes(nextCode)) {
          suggestions.push(nextCode);
        }
      });
    }
    
    return suggestions.slice(0, 3); // Return max 3 suggestions
  }, [accounts, getAllAccountCodes]);

  // Check if account code is duplicate
  const isCodeDuplicate = useCallback((code: string, excludeId?: string): boolean => {
    const existingCodes = getAllAccountCodes();
    return existingCodes.some(existingCode => 
      existingCode === code && 
      (!excludeId || findAccountByCode(existingCode)?.id !== excludeId)
    );
  }, [getAllAccountCodes]);

  // Find account by ID
  const findAccountById = useCallback((id: string): Account | null => {
    function traverse(nodes: Account[]): Account | null {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children) {
          const found = traverse(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    
    return traverse(accounts);
  }, [accounts]);

  // Find account by code
  const findAccountByCode = useCallback((code: string): Account | null => {
    function traverse(nodes: Account[]): Account | null {
      for (const node of nodes) {
        if (node.code === code) {
          return node;
        }
        if (node.children) {
          const found = traverse(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    
    return traverse(accounts);
  }, [accounts]);

  // Load accounts function (for backward compatibility)
  const loadAccounts = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  }, [queryClient]);

  // Load account types function (for backward compatibility)
  const loadAccountTypes = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['accountTypes'] });
  }, [queryClient]);

  // Create account function
  const createAccount = useCallback(async (data: Partial<Account>): Promise<Account | null> => {
    if (!isAuthenticated || !canCreate) return null;
    return createMutation.mutateAsync(data);
  }, [isAuthenticated, canCreate, createMutation]);

  // Update account function
  const updateAccount = useCallback(async (id: string, data: Partial<Account>): Promise<Account | null> => {
    if (!isAuthenticated || !canUpdate) return null;
    return updateMutation.mutateAsync({ id, data });
  }, [isAuthenticated, canUpdate, updateMutation]);

  // Delete account function
  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated || !canDelete) return false;
    return deleteMutation.mutateAsync(id);
  }, [isAuthenticated, canDelete, deleteMutation]);

  // Toggle expanded node
  const toggleExpandedNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Expand all nodes
  const expandAllNodes = useCallback(() => {
    function collectNodeIds(nodes: Account[]) {
      const ids: string[] = [];
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          ids.push(node.id);
          ids.push(...collectNodeIds(node.children));
        }
      }
      return ids;
    }
    
    const allNodeIds = collectNodeIds(accounts);
    setExpandedNodes(new Set(allNodeIds));
  }, [accounts]);

  // Collapse all nodes
  const collapseAllNodes = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Filtered accounts - Proper tree filtering (based on original working code)
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) {
      return accounts;
    }

    const term = searchTerm.toLowerCase().trim();
    
    // Recursive tree filtering function (from original working code)
    function filterNodes(nodes: Account[]): Account[] {
      const filtered: Account[] = [];
      
      for (const node of nodes) {
        const matches = nodeMatchesSearch(node, term);
        const hasMatchingChildren = node.children && node.children.length > 0;
        
        if (matches) {
          // If this node matches, include it with all its children
          filtered.push({
            ...node,
            children: hasMatchingChildren ? filterNodes(node.children!) : []
          });
        } else if (hasMatchingChildren) {
          // If this node doesn't match but has children, check children
          const filteredChildren = filterNodes(node.children!);
          if (filteredChildren.length > 0) {
            filtered.push({
              ...node,
              children: filteredChildren
            });
          }
        }
      }
      
      return filtered;
    }
    
    // Node matching function (from original working code)
    function nodeMatchesSearch(node: Account, term: string): boolean {
      if (node.isAccountType) {
        // For account type nodes, search in name, type, and description
        return (
          node.name.toLowerCase().includes(term) ||
          node.type.toLowerCase().includes(term) ||
          !!(node.description && node.description.toLowerCase().includes(term))
        );
      } else {
        // For account nodes, search in name, code, type, and status
        return (
          node.name.toLowerCase().includes(term) ||
          !!(node.code && node.code.toLowerCase().includes(term)) ||
          node.type.toLowerCase().includes(term) ||
          !!(node.status && node.status.toLowerCase().includes(term))
        );
      }
    }
    
    return filterNodes([...accounts]); // Create a copy to avoid mutating original
  }, [accounts, searchTerm]);

  // Export functions
  const exportToExcel = useCallback(async (filters?: AccountFilters) => {
    if (!isAuthenticated || !canExport) return;
    
    try {
      const blob = await accountService.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart-of-accounts.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Excel export completed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export to Excel');
    }
  }, [isAuthenticated, canExport]);

  const exportToPDF = useCallback(async (filters?: AccountFilters) => {
    if (!isAuthenticated || !canExport) return;
    
    try {
      const blob = await accountService.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart-of-accounts.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF export completed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export to PDF');
    }
  }, [isAuthenticated, canExport]);

  return {
    // State
    accounts,
    accountTypes,
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    searchTerm,
    filters,
    sort,
    expandedNodes,
    
    // Actions
    loadAccounts,
    loadAccountTypes,
    createAccount,
    updateAccount,
    deleteAccount,
    setSearchTerm,
    setFilters,
    setSort,
    toggleExpandedNode,
    expandAllNodes,
    collapseAllNodes,
    exportToExcel,
    exportToPDF,
    
    // Computed
    filteredAccounts,
    hasData,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    findAccountById,
    findAccountByCode
  };
}; 