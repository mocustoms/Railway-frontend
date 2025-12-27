import React, { useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Account } from '../types';

interface TreeViewProps {
  nodes: Account[];
  level?: number;
  expandedNodes: Set<string>;
  searchTerm?: string;
  onToggleNode: (nodeId: string) => void;
  onAddChild: (node: Account) => void;
  onEdit: (node: Account) => void;
  onView: (node: Account) => void;
  onDelete: (node: Account) => void;
  onAddToType: (accountType: string) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  isDeleting?: boolean;
  getAccountTypeColor: (type: string) => string;
  highlightSearchTerm: (text: string, term: string) => string;
}

const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  level = 0,
  expandedNodes,
  searchTerm = '',
  onToggleNode,
  onAddChild,
  onEdit,
  onView,
  onDelete,
  onAddToType,
  canUpdate = false,
  canDelete = false,
  isDeleting = false,
  getAccountTypeColor,
  highlightSearchTerm
}) => {
  const renderTreeNode = useCallback((node: Account) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isAccountType = node.isAccountType;
    
    // Format creation date
    const createdDate = node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'N/A';
    
    // Get creator name
    let creatorName = 'Unknown';
    if (node.creator) {
      if (node.creator.firstName && node.creator.lastName) {
        creatorName = `${node.creator.firstName} ${node.creator.lastName}`;
      } else if (node.creator.username) {
        creatorName = node.creator.username;
      }
    }
    
    // Different styling for account type nodes
    const nodeClass = isAccountType ? 'account-tree-node account-type-node' : 'account-tree-node';
    const rowClass = isAccountType ? 'account-node-row account-type-row' : 'account-node-row';
    const titleClass = isAccountType ? 'account-node-title account-type-title' : 'account-node-title';
    
    // Highlight search terms if search is active
    const highlightedName = searchTerm ? highlightSearchTerm(node.name, searchTerm) : node.name;
    const highlightedCode = !isAccountType && node.code && searchTerm ? highlightSearchTerm(node.code, searchTerm) : node.code;
    const highlightedType = searchTerm ? highlightSearchTerm(node.type, searchTerm) : node.type;
    const highlightedStatus = !isAccountType && searchTerm ? highlightSearchTerm(node.status || '', searchTerm) : node.status;
    const highlightedDescription = isAccountType && node.description && searchTerm ? highlightSearchTerm(node.description, searchTerm) : node.description;
    
    return (
      <li key={node.id} className={nodeClass}>
        <div className={rowClass} style={{ paddingLeft: `${level * 24 + 16}px` }}>
          {hasChildren ? (
            <button
              className="tree-toggle"
              onClick={() => onToggleNode(node.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="tree-toggle-placeholder"></span>
          )}
          
          <span className="account-node-main">
            {!isAccountType && (
              <span className="account-node-code">{highlightedCode}</span>
            )}
            <span className={titleClass} dangerouslySetInnerHTML={{ __html: highlightedName }}></span>
            {!isAccountType && (
              <span 
                className="account-node-type badge badge-type"
                style={{ backgroundColor: getAccountTypeColor(node.type) + '20', color: getAccountTypeColor(node.type) }}
                dangerouslySetInnerHTML={{ __html: highlightedType }}
              ></span>
            )}
            {!isAccountType && node.status && (
              <span 
                className={`account-node-status badge badge-status-${node.status}`}
                dangerouslySetInnerHTML={{ __html: highlightedStatus }}
              ></span>
            )}
            {isAccountType && (
              <span className="account-count-badge">{node.accountCount} accounts</span>
            )}
          </span>
          
          <span className="account-node-meta">
            {!isAccountType ? (
              <>
                <span className="account-node-creator" title={`Created by ${creatorName}`}>
                  <i className="fas fa-user"></i> {creatorName}
                </span>
                <span className="account-node-date" title={`Created on ${createdDate}`}>
                  <i className="fas fa-calendar"></i> {createdDate}
                </span>
              </>
            ) : (
              <span 
                className="account-type-description"
                dangerouslySetInnerHTML={{ __html: highlightedDescription || node.description || '' }}
              ></span>
            )}
          </span>
          
          <span className="account-node-actions">
            {!isAccountType ? (
              <>
                <button
                  onClick={() => onAddChild(node)}
                  className="text-green-600 hover:text-green-900 p-1"
                  title="Add Child"
                >
                  <Plus size={16} />
                </button>
                {canUpdate && (
                  <button
                    onClick={() => onEdit(node)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                )}
                <button
                  onClick={() => onView(node)}
                  className="text-gray-600 hover:text-gray-900 p-1"
                  title="View"
                >
                  <Eye size={16} />
                </button>
                {canDelete && !hasChildren && (
                  <button
                    onClick={() => onDelete(node)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete"
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => onAddToType(node.accountTypeId || node.type)}
                className="text-green-600 hover:text-green-900 p-1"
                title={`Add Account to ${node.name}`}
              >
                <Plus size={16} />
              </button>
            )}
          </span>
        </div>
        
        {hasChildren && isExpanded && node.children && (
          <TreeView
            nodes={node.children}
            level={level + 1}
            expandedNodes={expandedNodes}
            searchTerm={searchTerm}
            onToggleNode={onToggleNode}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onAddToType={onAddToType}
            canUpdate={canUpdate}
            canDelete={canDelete}
            isDeleting={isDeleting}
            getAccountTypeColor={getAccountTypeColor}
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
    onAddChild,
    onEdit,
    onView,
    onDelete,
    onAddToType,
    canUpdate,
    canDelete,
    isDeleting,
    getAccountTypeColor,
    highlightSearchTerm
  ]);

  return (
    <ul className={`account-tree-level account-tree-level-${level}`}>
      {nodes.map(renderTreeNode)}
    </ul>
  );
};

export default TreeView; 