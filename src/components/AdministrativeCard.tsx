import React from 'react';
import { Settings, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { AdministrativeModule, PRIORITY_CONFIG, STATUS_CONFIG } from '../data/administrativeModules';

interface AdministrativeCardProps {
  module: AdministrativeModule;
  onClick: (module: AdministrativeModule) => void;
  index: number;
}

const AdministrativeCard: React.FC<AdministrativeCardProps> = ({ module, onClick, index }) => {
  const IconComponent = module.icon;
  const priorityConfig = PRIORITY_CONFIG[module.priority];
  const statusConfig = module.status ? STATUS_CONFIG[module.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div
      className="administrative-card"
      onClick={() => onClick(module)}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <div className="administrative-card-header">
        <div 
          className="administrative-icon"
          style={{ background: module.gradient }}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <div className="administrative-badges">
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

      <div className="administrative-card-content">
        <h3 className="administrative-title">{module.title}</h3>
        <p className="administrative-description">{module.description}</p>
        
        <div className="administrative-features">
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

        <div className="administrative-tags">
          {module.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="administrative-card-footer">
        <div className="administrative-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick access
              }}
            title="Quick Access"
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
        
        <div className="administrative-arrow">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div 
        className="administrative-card-overlay"
        style={{ background: module.gradient }}
      />
    </div>
  );
};

export default AdministrativeCard;