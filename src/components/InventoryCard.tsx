import React from 'react';
import { Settings, AlertTriangle, CheckCircle, Clock, Star, ArrowRight, Activity } from 'lucide-react';
import { InventoryModule, PRIORITY_CONFIG, STATUS_CONFIG, STOCK_LEVEL_CONFIG } from '../data/inventoryModules';

interface InventoryCardProps {
  module: InventoryModule;
  onClick: (module: InventoryModule) => void;
  index: number;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ module, onClick, index }) => {
  const IconComponent = module.icon;
  const priorityConfig = PRIORITY_CONFIG[module.priority];
  const statusConfig = module.status ? STATUS_CONFIG[module.status] : null;
  const stockLevelConfig = module.stockLevel ? STOCK_LEVEL_CONFIG[module.stockLevel] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div
      className="inventory-card"
      onClick={() => onClick(module)}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <div className="inventory-card-header">
        <div 
          className="inventory-icon"
          style={{ background: module.gradient }}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <div className="inventory-badges">
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

          {/* Stock Level Badge */}
          {stockLevelConfig && (
            <span 
              className="stock-level-badge"
              style={{ 
                backgroundColor: stockLevelConfig.bgColor, 
                color: stockLevelConfig.color 
              }}
            >
              <Activity className="h-3 w-3 mr-1" />
              {stockLevelConfig.label}
            </span>
          )}
        </div>
      </div>

      <div className="inventory-card-content">
        <h3 className="inventory-title">{module.title}</h3>
        <p className="inventory-description">{module.description}</p>
        
        <div className="inventory-features">
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

        <div className="inventory-tags">
          {module.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="inventory-card-footer">
        <div className="inventory-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick access
              }}
            title="Quick Access"
          >
            <Activity className="h-4 w-4" />
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
        
        <div className="inventory-arrow">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div 
        className="inventory-card-overlay"
        style={{ background: module.gradient }}
      />
    </div>
  );
};

export default InventoryCard;