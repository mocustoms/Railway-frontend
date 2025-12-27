import React from 'react';
import { ReturnReason } from '../types';
import { returnTypeConfig, returnReasonStatusConfig, approvalConfig } from '../data/returnReasonModules';
import './ReturnReasonView.css';

interface ReturnReasonViewProps {
  returnReason: ReturnReason;
  onEdit?: () => void;
}

const ReturnReasonView: React.FC<ReturnReasonViewProps> = ({
  returnReason,
  onEdit
}) => {
  const typeConfig = returnTypeConfig[returnReason.returnType];
  const statusConfig = returnReasonStatusConfig[returnReason.isActive ? 'active' : 'inactive'];
  const approvalStatusConfig = approvalConfig[returnReason.requiresApproval ? 'true' : 'false'];

  return (
    <div className="return-reason-view">
      <div className="view-header">
        <h3 className="view-title">Return Reason Details</h3>
        {onEdit && (
          <button className="edit-btn" onClick={onEdit}>
            <i className="fas fa-edit"></i>
            Edit
          </button>
        )}
      </div>

      <div className="view-content">
        <div className="view-section">
          <h4 className="section-title">Basic Information</h4>
          <div className="view-grid">
            <div className="view-item">
              <label className="view-label">Reason Name:</label>
              <span className="view-value">{returnReason.name}</span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Reason Code:</label>
              <span className="view-value code-value">{returnReason.code}</span>
            </div>
            
            <div className="view-item full-width">
              <label className="view-label">Description:</label>
              <span className="view-value">
                {returnReason.description || 'No description provided'}
              </span>
            </div>
          </div>
        </div>

        <div className="view-section">
          <h4 className="section-title">Return Configuration</h4>
          <div className="view-grid">
            <div className="view-item">
              <label className="view-label">Return Type:</label>
              <span className="view-value">
                <span className={`return-type-badge ${returnReason.returnType}`}>
                  <i className={`fas fa-${returnReason.returnType === 'full_refund' ? 'money-bill-wave' : 
                    returnReason.returnType === 'partial_refund' ? 'money-bill-wave-alt' : 
                    returnReason.returnType === 'exchange' ? 'exchange-alt' : 'credit-card'}`}></i>
                  {typeConfig.label}
                </span>
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Approval Required:</label>
              <span className="view-value">
                <span className={`approval-badge ${returnReason.requiresApproval ? 'requires' : 'auto'}`}>
                  <i className={`fas fa-${returnReason.requiresApproval ? 'clock' : 'check'}`}></i>
                  {approvalStatusConfig.label}
                </span>
              </span>
            </div>

            <div className="view-item">
              <label className="view-label">Max Return Days:</label>
              <span className="view-value">
                {returnReason.maxReturnDays ? `${returnReason.maxReturnDays} days` : 'No limit'}
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Status:</label>
              <span className="view-value">
                <span className={`status-badge ${returnReason.isActive ? 'active' : 'inactive'}`}>
                  <i className={`fas fa-${returnReason.isActive ? 'check' : 'times'}`}></i>
                  {statusConfig.label}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="view-section">
          <h4 className="section-title">Account Configuration</h4>
          <div className="view-grid">
            <div className="view-item">
              <label className="view-label">Refund Account:</label>
              <span className="view-value">
                {returnReason.refundAccount ? (
                  <span className="account-info">
                    <span className="account-code">{returnReason.refundAccount.code}</span>
                    <span className="account-name">{returnReason.refundAccount.name}</span>
                  </span>
                ) : (
                  'Not assigned'
                )}
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Inventory Account:</label>
              <span className="view-value">
                {returnReason.inventoryAccount ? (
                  <span className="account-info">
                    <span className="account-code">{returnReason.inventoryAccount.code}</span>
                    <span className="account-name">{returnReason.inventoryAccount.name}</span>
                  </span>
                ) : (
                  'Not assigned'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnReasonView;
