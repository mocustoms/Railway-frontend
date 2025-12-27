import React from 'react';
import { AdjustmentReason } from '../types';
import { adjustmentTypeConfig, adjustmentReasonStatusConfig } from '../data/adjustmentReasonModules';
import { formatDate } from '../utils/formatters';
import './AdjustmentReasonView.css';

interface AdjustmentReasonViewProps {
  adjustmentReason: AdjustmentReason;
  onEdit?: () => void;
}

const AdjustmentReasonView: React.FC<AdjustmentReasonViewProps> = ({
  adjustmentReason,
  onEdit
}) => {
  const typeConfig = adjustmentTypeConfig[adjustmentReason.adjustmentType];
  const statusConfig = adjustmentReasonStatusConfig[adjustmentReason.isActive ? 'active' : 'inactive'];

  return (
    <div className="adjustment-reason-view">
      <div className="view-header">
        <h3 className="view-title">Adjustment Reason Details</h3>
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
              <span className="view-value">{adjustmentReason.name}</span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Reason Code:</label>
              <span className="view-value code-value">{adjustmentReason.code}</span>
            </div>
            
            <div className="view-item full-width">
              <label className="view-label">Description:</label>
              <span className="view-value">
                {adjustmentReason.description || 'No description provided'}
              </span>
            </div>
          </div>
        </div>

        <div className="view-section">
          <h4 className="section-title">Adjustment Configuration</h4>
          <div className="view-grid">
            <div className="view-item">
              <label className="view-label">Adjustment Type:</label>
              <span className="view-value">
                <span className={`adjustment-type-badge ${adjustmentReason.adjustmentType}`}>
                  <i className={`fas fa-${adjustmentReason.adjustmentType === 'add' ? 'plus' : 'minus'}`}></i>
                  {typeConfig.label}
                </span>
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Status:</label>
              <span className="view-value">
                <span className={`status-badge ${adjustmentReason.isActive ? 'active' : 'inactive'}`}>
                  <i className={`fas fa-${adjustmentReason.isActive ? 'check' : 'times'}`}></i>
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
              <label className="view-label">Tracking Account:</label>
              <span className="view-value">
                {adjustmentReason.trackingAccount ? (
                  <span className="account-info">
                    <span className="account-code">{adjustmentReason.trackingAccount.code}</span>
                    <span className="account-name">{adjustmentReason.trackingAccount.name}</span>
                  </span>
                ) : (
                  'Not assigned'
                )}
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Corresponding Account:</label>
              <span className="view-value">
                {adjustmentReason.correspondingAccount ? (
                  <span className="account-info">
                    <span className="account-code">{adjustmentReason.correspondingAccount.code}</span>
                    <span className="account-name">{adjustmentReason.correspondingAccount.name}</span>
                  </span>
                ) : (
                  'Not assigned'
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="view-section">
          <h4 className="section-title">Audit Information</h4>
          <div className="view-grid">
            <div className="view-item">
              <label className="view-label">Created By:</label>
              <span className="view-value">
                {adjustmentReason.createdByUser ? (
                  `${adjustmentReason.createdByUser.first_name} ${adjustmentReason.createdByUser.last_name}`
                ) : (
                  'System'
                )}
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Created Date:</label>
              <span className="view-value">{formatDate(adjustmentReason.createdAt)}</span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Updated By:</label>
              <span className="view-value">
                {adjustmentReason.updatedByUser ? (
                  `${adjustmentReason.updatedByUser.first_name} ${adjustmentReason.updatedByUser.last_name}`
                ) : (
                  'System'
                )}
              </span>
            </div>
            
            <div className="view-item">
              <label className="view-label">Updated Date:</label>
              <span className="view-value">{formatDate(adjustmentReason.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentReasonView;
