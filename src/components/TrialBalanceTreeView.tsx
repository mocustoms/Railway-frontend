import React, { useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TrialBalanceAccount } from '../services/trialBalanceReportService';
import './TrialBalanceTreeView.css';

interface TrialBalanceTreeViewProps {
  accounts: TrialBalanceAccount[];
  level?: number;
  expandedNodes: Set<string>;
  searchTerm?: string;
  onToggleNode: (nodeId: string) => void;
  formatCurrency: (amount: number) => string; // Actually formatAmount (no symbol) for rows
  highlightSearchTerm?: (text: string, term: string) => string;
}

const TrialBalanceTreeView: React.FC<TrialBalanceTreeViewProps> = ({
  accounts,
  level = 0,
  expandedNodes,
  searchTerm = '',
  onToggleNode,
  formatCurrency,
  highlightSearchTerm
}) => {
  const renderAccountNode = useCallback((account: TrialBalanceAccount) => {
    const isExpanded = expandedNodes.has(account.id);
    const hasChildren = account.children && account.children.length > 0;
    const isAccountType = account.isAccountType || false;
    const isLeaf = account.isLeaf || false;
    
    // Highlight search terms if search is active
    const highlight = highlightSearchTerm || ((text: string) => text);
    const highlightedCode = searchTerm ? highlight(account.code || '', searchTerm) : account.code;
    const highlightedName = searchTerm ? highlight(account.name || '', searchTerm) : account.name;
    
    // Different styling for account type nodes
    const nodeClass = isAccountType ? 'trial-balance-node account-type-node' : 'trial-balance-node';
    const rowClass = isAccountType ? 'trial-balance-row account-type-row' : 'trial-balance-row';
    const titleClass = isAccountType ? 'trial-balance-title account-type-title' : 'trial-balance-title';
    
    return (
      <li key={account.id} className={nodeClass}>
        <div className={rowClass} style={{ paddingLeft: `${level * 24 + 16}px` }}>
          {/* Tree Toggle Button */}
          {hasChildren ? (
            <button
              className="tree-toggle"
              onClick={() => onToggleNode(account.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="tree-toggle-placeholder"></span>
          )}
          
          {/* Account Code */}
          <div className="trial-balance-code">
            {!isAccountType && account.code && (
              <span 
                className="account-code-badge"
                dangerouslySetInnerHTML={{ __html: highlightedCode || '' }}
              ></span>
            )}
          </div>
          
          {/* Account Name */}
          <div className="trial-balance-name">
            <span 
              className={titleClass}
              dangerouslySetInnerHTML={{ __html: highlightedName || '' }}
            ></span>
            {isAccountType && (
              <span className="account-count-badge">
                {account.children?.length || 0} accounts
              </span>
            )}
          </div>
          
          {/* Debit Amount */}
          <div className="trial-balance-debit">
            <span className={isAccountType ? 'font-bold' : ''}>
              {formatCurrency(account.totalDebit)}
            </span>
          </div>
          
          {/* Credit Amount */}
          <div className="trial-balance-credit">
            <span className={isAccountType ? 'font-bold' : ''}>
              {formatCurrency(account.totalCredit)}
            </span>
          </div>
        </div>
        
        {/* Render Children */}
        {hasChildren && isExpanded && account.children && (
          <TrialBalanceTreeView
            accounts={account.children}
            level={level + 1}
            expandedNodes={expandedNodes}
            searchTerm={searchTerm}
            onToggleNode={onToggleNode}
            formatCurrency={formatCurrency}
            highlightSearchTerm={highlightSearchTerm}
          />
        )}
      </li>
    );
  }, [
    level,
    expandedNodes,
    searchTerm,
    onToggleNode,
    formatCurrency,
    highlightSearchTerm
  ]);

  return (
    <ul className={`trial-balance-tree-level trial-balance-tree-level-${level}`}>
      {accounts.map(renderAccountNode)}
    </ul>
  );
};

export default TrialBalanceTreeView;

