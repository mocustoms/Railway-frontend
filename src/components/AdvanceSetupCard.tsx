import React from 'react';
import { Settings, AlertTriangle, CheckCircle, Clock, Star, ArrowRight } from 'lucide-react';
import { AdvanceSetupModule, PRIORITY_CONFIG, STATUS_CONFIG } from '../data/advanceSetupModules';

interface AdvanceSetupCardProps {
  module: AdvanceSetupModule;
  onClick: (module: AdvanceSetupModule) => void;
  index: number;
}

const AdvanceSetupCard: React.FC<AdvanceSetupCardProps> = ({ module, onClick, index }) => {
  const IconComponent = module.icon;
  const priorityConfig = PRIORITY_CONFIG[module.priority];
  const statusConfig = module.status ? STATUS_CONFIG[module.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div
      className="advance-setup-card"
      onClick={() => onClick(module)}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <div className="advance-setup-card-header">
        <div 
          className="advance-setup-icon"
          style={{ background: module.gradient }}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <div className="advance-setup-badges">
          {/* Required Badge */}
          {module.isRequired && (
            <span className="required-badge">
              <Star className="h-3 w-3 mr-1" />
              Required
            </span>
          )}
          
          {/* Priority Badge */}
          <span 
            className="priority-badge"
            style={{ 
              backgroundColor: priorityConfig.bgColor, 
              color: priorityConfig.color 
            }}
          >
            {priorityConfig.label}
          </span>
          
          {/* Status Badge */}
          {statusConfig && (
            <span 
              className="status-badge"
              style={{ 
                backgroundColor: statusConfig.color + '20', 
                color: statusConfig.color 
              }}
            >
              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
              {statusConfig.label}
            </span>
          )}
        </div>
      </div>

      <div className="advance-setup-card-content">
        <h3 className="advance-setup-title">{module.title}</h3>
        <p className="advance-setup-description">{module.description}</p>
        
        <div className="advance-setup-features">
          {module.features.slice(0, 3).map((feature, idx) => (
            <span key={idx} className="feature-tag">
              {feature}
            </span>
          ))}
          {module.features.length > 3 && (
            <span className="feature-tag more">
              +{module.features.length - 3} more
            </span>
          )}
        </div>

        <div className="advance-setup-tags">
          {module.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="advance-setup-card-footer">
        <div className="advance-setup-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick setup
              }}
            title="Quick Setup"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement module status
              }}
            title="Module Status"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement configuration
              }}
            title="Configuration"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        
        <div className="advance-setup-arrow">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div 
        className="advance-setup-card-overlay"
        style={{ background: module.gradient }}
      />
    </div>
  );
};

export default AdvanceSetupCard;